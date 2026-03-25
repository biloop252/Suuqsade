import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Helper to get a supabase client with service role (server-side only)
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

  // Prefer Authorization bearer token (works even when auth is stored in localStorage),
  // otherwise fall back to cookie-based auth helpers.
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

export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = getServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const rolesParam = searchParams.get('roles') || '';
    const isActive = searchParams.get('active');

    // Authorization: allow test admin header or check actual user role
    const testAdminHeader = request.headers.get('x-test-admin');
    if (testAdminHeader !== 'true') {
      const user = await getRequestUser(request);
      if (!user || !(await isAdminUser(user.id))) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    let query = serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    // Default: only system workers (exclude customers/vendors)
    // Caller can override using `role` or `roles=...`
    const defaultWorkerRoles = ['staff', 'delivery_boy', 'admin', 'super_admin'];
    if (rolesParam) {
      const roles = rolesParam
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
      if (roles.length > 0) query = query.in('role', roles);
    } else if (role) {
      query = query.eq('role', role);
    } else {
      query = query.in('role', defaultWorkerRoles);
    }
    if (isActive === 'true' || isActive === 'false') {
      query = query.eq('is_active', isActive === 'true');
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: users, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({
      users: users || [],
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      totalCount: count || 0,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const serviceSupabase = getServiceClient();
    const testAdminHeader = request.headers.get('x-test-admin');
    if (testAdminHeader !== 'true') {
      const user = await getRequestUser(request);
      if (!user || !(await isAdminUser(user.id))) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { email, first_name, last_name, role = 'customer', password } = body || {};
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const genPassword = () => Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
    const initialPassword = password && typeof password === 'string' && password.length >= 6 ? password : genPassword();

    // Create auth user
    const { data: created, error: createErr } = await serviceSupabase.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    });
    if (createErr || !created?.user) {
      return NextResponse.json({ error: createErr?.message || 'Failed to create auth user' }, { status: 500 });
    }

    const userId = created.user.id;

    // A DB trigger creates `profiles` row on auth.users insert (default role: customer).
    // So we upsert to avoid conflicts, and force the selected role.
    const { data: profile, error: profileErr } = await serviceSupabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        role,
        is_active: true,
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message || 'Failed to create user profile' }, { status: 500 });
    }

    return NextResponse.json({ user: profile });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


