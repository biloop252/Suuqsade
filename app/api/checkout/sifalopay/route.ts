import { NextRequest, NextResponse } from 'next/server';
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server';

const SIFALOPAY_GATEWAY = 'https://api.sifalopay.com/gateway/';
const SIFALOPAY_CHECKOUT_BASE = 'https://pay.sifalo.com/checkout/';

export async function POST(request: NextRequest) {
  try {
    const username = process.env.SIFALOPAY_API_USERNAME;
    const password = process.env.SIFALOPAY_API_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Sifalo Pay API credentials not configured' },
        { status: 500 }
      );
    }

    const supabase = createRequestClient(request);
    const userId = await getAuthenticatedUserId(request);

    const body = await request.json();
    const {
      amount,
      shipping_address_id,
      billing_address_id,
      notes,
      items,
      pricing,
    } = body || {};

    if (!amount || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'amount and items are required' },
        { status: 400 }
      );
    }

    // Create a checkout session (NOT an order). The real order is created after payment success.
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .insert({
        user_id: userId,
        payment_method: 'sifalo_pay',
        currency: 'USD',
        amount: Number(amount),
        shipping_address_id: shipping_address_id || null,
        billing_address_id: billing_address_id || shipping_address_id || null,
        notes: notes || '',
        items,
        pricing: pricing || null,
        status: 'created',
      })
      .select('id')
      .single();

    if (sessionError || !session?.id) {
      return NextResponse.json(
        { error: sessionError?.message || 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (request.headers.get('x-forwarded-proto') && request.headers.get('host')
        ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
        : 'http://localhost:3000');

    const returnUrl = `${baseUrl}/checkout/return?session_id=${encodeURIComponent(session.id)}`;

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const gatewayBody = {
      amount: String(amount),
      gateway: 'checkout',
      currency: 'USD',
      return_url: returnUrl,
    };

    const res = await fetch(SIFALOPAY_GATEWAY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(gatewayBody),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Sifalo Pay gateway error', details: data },
        { status: res.status }
      );
    }

    const rawKey = String(data.key ?? data.data?.key ?? '').trim();
    const rawToken = String(data.token ?? data.data?.token ?? '').trim();
    if (!rawKey || !rawToken) {
      return NextResponse.json(
        { error: 'Invalid response from Sifalo Pay', details: data },
        { status: 502 }
      );
    }

    // Sifalo may return key/token already URL-encoded. Encoding again causes %253D and "Payment Link No Longer Exists".
    // If they look pre-encoded (contain %), use as-is; otherwise encode once for safe query string.
    const keyParam =
      /%[0-9A-Fa-f]{2}/.test(rawKey) ? rawKey : encodeURIComponent(rawKey);
    const tokenParam =
      /%[0-9A-Fa-f]{2}/.test(rawToken) ? rawToken : encodeURIComponent(rawToken);
    const checkoutUrl = `${SIFALOPAY_CHECKOUT_BASE}?key=${keyParam}&token=${tokenParam}`;

    return NextResponse.json({ key: rawKey, token: rawToken, checkoutUrl, session_id: session.id });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Sifalo Pay initiate error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment initiation failed' },
      { status: 500 }
    );
  }
}
