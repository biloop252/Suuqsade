import { NextRequest, NextResponse } from 'next/server';

const SIFALOPAY_VERIFY = 'https://api.sifalopay.com/gateway/verify.php';

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
    const { sid, order_id } = body;

    if (!sid && !order_id) {
      return NextResponse.json(
        { error: 'sid or order_id is required' },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const verifyBody = sid ? { sid } : { order_id };

    const res = await fetch(SIFALOPAY_VERIFY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(verifyBody),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Sifalo Pay verify error', details: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Sifalo Pay verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
