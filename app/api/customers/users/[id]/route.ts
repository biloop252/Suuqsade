import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params || {};
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();

    return NextResponse.json({
      id: profile.id,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      avatar_url: profile.avatar_url || null,
      role: profile.role || null,
      name: name || null,
    });
  } catch (_e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}















