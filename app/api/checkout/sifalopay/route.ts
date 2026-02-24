import { NextRequest, NextResponse } from 'next/server';

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

    const body = await request.json();
    const { amount, order_id } = body;

    if (!amount || !order_id) {
      return NextResponse.json(
        { error: 'amount and order_id are required' },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (request.headers.get('x-forwarded-proto') && request.headers.get('host')
        ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
        : 'http://localhost:3000');

    const returnUrl = `${baseUrl}/checkout/return?order_id=${encodeURIComponent(order_id)}`;

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

    return NextResponse.json({ key: rawKey, token: rawToken, checkoutUrl });
  } catch (err) {
    console.error('Sifalo Pay initiate error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment initiation failed' },
      { status: 500 }
    );
  }
}
