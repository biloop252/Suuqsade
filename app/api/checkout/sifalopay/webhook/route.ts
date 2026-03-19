import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SIFALOPAY_VERIFY = 'https://api.sifalopay.com/gateway/verify.php';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sid, session_id } = body || {};

    if (!sid && !session_id) {
      return NextResponse.json({ error: 'sid or session_id is required' }, { status: 400 });
    }

    const username = process.env.SIFALOPAY_API_USERNAME;
    const password = process.env.SIFALOPAY_API_PASSWORD;
    if (!username || !password) {
      return NextResponse.json({ error: 'Sifalo Pay API credentials not configured' }, { status: 500 });
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
    const status = String(verifyData?.status ?? '').toLowerCase();
    const isSuccess = status === 'success';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sessionId = session_id;
    if (!sessionId) {
      return NextResponse.json({ success: false, status, error: 'session_id required' }, { status: 400 });
    }

    const { data: session } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ success: false, status, error: 'Checkout session not found' }, { status: 404 });
    }

    // If already finalized, return idempotently.
    if ((session as any).order_id) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('id', (session as any).order_id)
        .single();

      return NextResponse.json({
        success: true,
        status: 'success',
        session_id: sessionId,
        order_id: existingOrder?.id ?? (session as any).order_id,
        order_number: existingOrder?.order_number ?? null,
        idempotent: true,
      });
    }

    if (!isSuccess) {
      await supabase
        .from('checkout_sessions')
        .update({
          status: status === 'failure' ? 'failed' : 'pending',
          pricing: {
            ...(((session as any).pricing || {}) as any),
            gateway_response: verifyData,
            sid: verifyData?.sid || sid || null,
            verified_status: status || 'unknown',
          },
        })
        .eq('id', sessionId);
      return NextResponse.json({ success: false, status, session_id: sessionId });
    }

    // Concurrency guard:
    // only one request can claim this session for finalization.
    const { data: claimedSession } = await supabase
      .from('checkout_sessions')
      .update({
        status: 'processing',
        pricing: {
          ...(((session as any).pricing || {}) as any),
          gateway_response: verifyData,
          sid: verifyData?.sid || sid || null,
          verified_status: status || 'unknown',
        },
      })
      .eq('id', sessionId)
      .is('order_id', null)
      .in('status', ['created', 'pending', 'paid'])
      .select('*')
      .maybeSingle();

    // Another request is already processing or already finished.
    if (!claimedSession) {
      const { data: latestSession } = await supabase
        .from('checkout_sessions')
        .select('order_id, status')
        .eq('id', sessionId)
        .single();

      if ((latestSession as any)?.order_id) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('id', (latestSession as any).order_id)
          .single();

        return NextResponse.json({
          success: true,
          status: 'success',
          session_id: sessionId,
          order_id: existingOrder?.id ?? (latestSession as any).order_id,
          order_number: existingOrder?.order_number ?? null,
          idempotent: true,
        });
      }

      return NextResponse.json({
        success: false,
        status: (latestSession as any)?.status || 'processing',
        session_id: sessionId,
        idempotent: true,
      });
    }

    const pricing = ((claimedSession as any).pricing || {}) as any;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: (claimedSession as any).user_id,
        status: 'confirmed',
        total_amount: (claimedSession as any).amount,
        subtotal: Number(pricing?.subtotal ?? (claimedSession as any).amount),
        tax_amount: Number(pricing?.tax_amount ?? 0),
        shipping_amount: Number(pricing?.shipping_amount ?? 0),
        discount_amount: Number(pricing?.discount_amount ?? 0),
        billing_address_id: (claimedSession as any).billing_address_id,
        shipping_address_id: (claimedSession as any).shipping_address_id,
        notes: (claimedSession as any).notes || '',
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, status: 'error', error: orderError?.message || 'Order create failed' }, { status: 500 });
    }

    const sessionItems = Array.isArray((claimedSession as any).items) ? (claimedSession as any).items : [];
    const orderItemsPayload = sessionItems.map((it: any) => ({
      order_id: (order as any).id,
      product_id: it.product_id,
      variant_id: it.variant_id || null,
      product_name: it.product_name || it.name || '',
      product_sku: it.product_sku || it.sku || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
    }));

    if (orderItemsPayload.length > 0) {
      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) {
        return NextResponse.json({ success: false, status: 'error', error: itemsError.message }, { status: 500 });
      }
    }

    await supabase.from('payments').insert({
      order_id: (order as any).id,
      amount: (claimedSession as any).amount,
      currency: (claimedSession as any).currency || 'USD',
      payment_method: 'sifalo_pay',
      status: 'paid',
      transaction_id: verifyData?.sid || sid,
      gateway_response: verifyData,
    });

    await supabase.from('deliveries').insert({
      order_id: (order as any).id,
      tracking_number: `TRK-${orderNumber}`,
      carrier: 'Standard Delivery',
      status: 'pending',
      estimated_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    await supabase
      .from('checkout_sessions')
      .update({ order_id: (order as any).id, status: 'paid' })
      .eq('id', sessionId);

    return NextResponse.json({
      success: true,
      status: 'success',
      session_id: sessionId,
      order_id: (order as any).id,
      order_number: (order as any).order_number,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, status: 'error', error: err instanceof Error ? err.message : 'Webhook failed' },
      { status: 500 }
    );
  }
}

