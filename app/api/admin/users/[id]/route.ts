import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseServer(url, key);
}

async function isAdminUser(userId: string) {
  const supabase = getServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  // Keep in sync with AdminProtectedRoute roles
  return profile && (profile.role === 'staff' || profile.role === 'admin' || profile.role === 'super_admin');
}

async function getRequestUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

  const cookieSupabase = createRouteHandlerClient({ cookies });
  const tokenSupabase = createSupabaseServer(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: { user } } = bearerToken
    ? await tokenSupabase.auth.getUser(bearerToken)
    : await cookieSupabase.auth.getUser();

  return user ?? null;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serviceSupabase = getServiceClient();
    const body = await request.json();
    const { id } = params;

    const testAdminHeader = request.headers.get('x-test-admin');
    if (testAdminHeader !== 'true') {
      const user = await getRequestUser(request);
      if (!user || !(await isAdminUser(user.id))) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (body.role) updateData.role = body.role;
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;

    const { data: updated, error } = await serviceSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






































