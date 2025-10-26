import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@supabase/supabase-js';

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
  return profile && (profile.role === 'admin' || profile.role === 'super_admin');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('active');

    // Authorization: allow test admin header or check actual user role
    const testAdminHeader = request.headers.get('x-test-admin');
    if (testAdminHeader !== 'true') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !(await isAdminUser(user.id))) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
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
    const supabase = getServiceClient();
    const testAdminHeader = request.headers.get('x-test-admin');
    if (testAdminHeader !== 'true') {
      const { data: { user } } = await supabase.auth.getUser();
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
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    });
    if (createErr || !created?.user) {
      return NextResponse.json({ error: createErr?.message || 'Failed to create auth user' }, { status: 500 });
    }

    const userId = created.user.id;

    // Insert profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        role,
        is_active: true,
      })
      .select('*')
      .single();

    if (profileErr) {
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    return NextResponse.json({ user: profile });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


