import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, phone, platform } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const isMobile = platform === 'mobile' || platform === 'ios' || platform === 'android';

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address is already registered' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null,
        },
        // For mobile: no redirect URL; OTP will be verified via verify-otp API
        ...(isMobile ? {} : { emailRedirectTo: undefined }),
      },
    });

    if (error) {
      // Check if error is due to existing user
      if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'A user with this email address is already registered' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const hasSession = !!data.session;
    const requiresOtpVerification = !hasSession || isMobile;

    // Mobile or when email confirmation is enabled: tell client to verify OTP via verify-otp API
    return NextResponse.json(
      {
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        ...(hasSession && !isMobile
          ? {
              session: {
                access_token: data.session!.access_token,
                refresh_token: data.session!.refresh_token,
                expires_at: data.session!.expires_at,
              },
            }
          : {}),
        requires_otp_verification: requiresOtpVerification,
        message: requiresOtpVerification
          ? 'Check your email for a 6-digit code to verify your account.'
          : 'Registration successful.',
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


























