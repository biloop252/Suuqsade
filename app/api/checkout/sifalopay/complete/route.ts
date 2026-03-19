import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SIFALOPAY_VERIFY = 'https://api.sifalopay.com/gateway/verify.php';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sid, session_id } = body;

    if (!sid && !session_id) {
      return NextResponse.json(
        { error: 'sid or session_id is required' },
        { status: 400 }
      );
    }

    const username = process.env.SIFALOPAY_API_USERNAME;
    const password = process.env.SIFALOPAY_API_PASSWORD;
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Sifalo Pay API credentials not configured' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const verifyBody = sid ? { sid } : { order_id: session_id };

    const verifyRes = await fetch(SIFALOPAY_VERIFY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(verifyBody),
    });

    const verifyData = await verifyRes.json().catch(() => ({}));
    const status = verifyData?.status?.toLowerCase();
    const isSuccess = status === 'success';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sessionId = session_id;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'session_id required' }, { status: 400 });
    }

    const { data: session } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Checkout session not found' },
        { status: 404 }
      );
    }

    // Update session status + attach gateway response for auditing/troubleshooting.
    await supabase
      .from('checkout_sessions')
      .update({
        status: isSuccess ? 'paid' : status === 'failure' ? 'failed' : 'pending',
        pricing: {
          ...(session.pricing || {}),
          gateway_response: verifyData,
          sid: verifyData?.sid || sid || null,
          verified_status: status || 'unknown',
        },
      })
      .eq('id', sessionId);

    // Pay-first: webhook is authoritative for order creation.
    // Fallback: if webhook was not delivered, trigger the same webhook flow internally once.
    let createdOrder: { id: string; order_number: string } | null = null;
    if (isSuccess) {
      let existingOrderId = (session as any).order_id as string | undefined;

      if (!existingOrderId) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          (request.headers.get('x-forwarded-proto') && request.headers.get('host')
            ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
            : 'http://localhost:3000');

        try {
          await fetch(`${baseUrl}/api/checkout/sifalopay/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sid: sid || verifyData?.sid || undefined,
              session_id: sessionId,
            }),
          });
        } catch (e) {
          console.error('Sifalo Pay webhook fallback call failed:', e);
        }

        const { data: refreshedSession } = await supabase
          .from('checkout_sessions')
          .select('order_id')
          .eq('id', sessionId)
          .single();
        existingOrderId = (refreshedSession as any)?.order_id || undefined;
      }

      if (existingOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('id', existingOrderId)
          .single();
        if (existingOrder) {
          createdOrder = existingOrder as any;
        }
      }
    }

    return NextResponse.json({
      success: isSuccess,
      status: status || 'unknown',
      order_number: createdOrder?.order_number || null,
      order_id: createdOrder?.id || null,
      session_id: sessionId,
    });
  } catch (err) {
    console.error('Sifalo Pay complete error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Completion failed' },
      { status: 500 }
    );
  }
}
