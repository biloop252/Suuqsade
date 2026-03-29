import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Verify recovery OTP and set a new password (mobile / API clients).
 * Same recovery type as web: verifyOtp(recovery) then updateUser(password).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, password } = body || {};

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, token (OTP), and password are required' },
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

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: String(email).trim(),
      token: code,
      type: 'recovery',
    });

    if (verifyError) {
      const status = verifyError.message.toLowerCase().includes('expired') ? 400 : 401;
      return NextResponse.json({ error: verifyError.message }, { status });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: String(password),
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const { data: refreshed } = await supabase.auth.getSession();

    return NextResponse.json({
      user: verifyData.user ? { id: verifyData.user.id, email: verifyData.user.email } : null,
      accessToken: refreshed.session?.access_token ?? verifyData.session?.access_token,
      refreshToken: refreshed.session?.refresh_token ?? verifyData.session?.refresh_token,
      expiresAt: refreshed.session?.expires_at ?? verifyData.session?.expires_at,
      message: 'Password updated.',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
