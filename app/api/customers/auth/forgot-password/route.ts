import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function appBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

/**
 * Sends a password recovery email via Supabase `/recover`.
 * For a 6-digit code in the email, configure the "Reset password" template in the Supabase
 * dashboard to include {{ .Token }} (OTP). Link-only templates use {{ .ConfirmationURL }}.
 * redirectTo is for users who still get a link; we send them back to the same reset flow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmed = email.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const redirectTo = `${appBaseUrl()}/auth/forgot-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo,
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const isRateLimited =
        msg.includes('rate limit') ||
        msg.includes('too many') ||
        msg.includes('email rate');

      if (isRateLimited) {
        return NextResponse.json(
          {
            error:
              'Too many reset emails were sent recently. Please wait a few minutes before trying again.',
            code: 'AUTH_EMAIL_RATE_LIMIT',
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'If an account exists for this email, you will receive reset instructions shortly.',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
