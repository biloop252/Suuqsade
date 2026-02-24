import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SIFALOPAY_VERIFY = 'https://api.sifalopay.com/gateway/verify.php';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sid, order_id } = body;

    if (!sid && !order_id) {
      return NextResponse.json(
        { error: 'sid or order_id is required' },
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
    const verifyBody = sid ? { sid } : { order_id };

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

    const orderId = order_id;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'order_id required to update payment' },
        { status: 400 }
      );
    }

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        transaction_id: verifyData?.sid || sid,
        status: isSuccess ? 'paid' : status === 'failure' ? 'failed' : 'pending',
        gateway_response: verifyData,
      })
      .eq('order_id', orderId);

    if (paymentUpdateError) {
      console.error('Error updating payment:', paymentUpdateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update payment record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: isSuccess,
      status: status || 'unknown',
      order_number: order.order_number,
      order_id: order.id,
    });
  } catch (err) {
    console.error('Sifalo Pay complete error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Completion failed' },
      { status: 500 }
    );
  }
}
