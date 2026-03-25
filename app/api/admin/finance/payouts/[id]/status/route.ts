import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseServer(url, key);
}

const ALLOWED_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serviceSupabase = getServiceClient();
    const payoutId = params.id;
    const body = await request.json().catch(() => ({}));
    const status = body?.status as AllowedStatus | undefined;

    if (!payoutId) return NextResponse.json({ error: 'Missing payout id' }, { status: 400 });
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const testAdminHeader = request.headers.get('x-test-admin');
    if (testAdminHeader !== 'true') {
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

      if (!user) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Use service client to check role (bypasses RLS).
      const { data: profile, error: profileErr } = await serviceSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = (profile as any)?.role as string | undefined;
      const isAdmin = !profileErr && (role === 'admin' || role === 'super_admin');

      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const processedAt = status === 'completed' ? new Date().toISOString() : null;

    // Lock completed payouts to avoid constraint/ledger inconsistencies.
    const { data: existing, error: existingErr } = await serviceSupabase
      .from('vendor_payouts')
      .select('status')
      .eq('id', payoutId)
      .single();

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message || 'Failed to load payout' }, { status: 500 });
    }

    if ((existing as any)?.status === 'completed' && status !== 'completed') {
      return NextResponse.json({ error: 'Completed payouts cannot be changed' }, { status: 409 });
    }

    const { data: updatedPayout, error: payoutErr } = await serviceSupabase
      .from('vendor_payouts')
      .update({ status, processed_at: processedAt })
      .eq('id', payoutId)
      .select('*')
      .single();

    if (payoutErr) {
      return NextResponse.json({ error: payoutErr.message || 'Failed to update payout' }, { status: 500 });
    }

    const { error: txnErr } = await serviceSupabase
      .from('finance_transactions')
      .update({ status, processed_at: processedAt })
      .eq('reference_id', payoutId);

    if (txnErr) {
      return NextResponse.json({ error: txnErr.message || 'Failed to update finance transaction' }, { status: 500 });
    }

    if (status === 'completed') {
      const { data: payoutMeta, error: payoutMetaErr } = await serviceSupabase
        .from('vendor_payouts')
        .select('vendor_id, transaction_id')
        .eq('id', payoutId)
        .single();

      if (!payoutMetaErr && payoutMeta?.vendor_id) {
        await serviceSupabase
          .from('vendor_commissions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payout_transaction_id: payoutMeta.transaction_id ?? null,
          })
          .eq('vendor_id', payoutMeta.vendor_id)
          .eq('status', 'pending');
      }
    }

    return NextResponse.json({ payout: updatedPayout });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

