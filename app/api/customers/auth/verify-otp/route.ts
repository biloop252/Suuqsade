import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Verify signup OTP (for mobile app and any client that cannot use Supabase client verifyOtp).
 * Same flow as the website: email + 6-digit token from signup email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body || {};

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token (OTP code) are required' },
        { status: 400 }
      );
    }

    const code = String(token).trim().replace(/\s/g, '');
    if (code.length < 6) {
      return NextResponse.json(
        { error: 'Please enter the 6-digit code from your email.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });

    if (error) {
      const status = error.message.toLowerCase().includes('expired') ? 400 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
      message: 'Email verified. You are signed in.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
