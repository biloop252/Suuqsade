import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        payments:payments(*),
        deliveries:deliveries(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const body = await request.json()

    const {
      items,
      shipping_address_id,
      billing_address_id,
      payment_method = 'cod',
      notes = ''
    } = body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items are required' }, { status: 400 })
    }
    if (!shipping_address_id) {
      return NextResponse.json({ error: 'shipping_address_id is required' }, { status: 400 })
    }

    let subtotal = 0
    for (const it of items) {
      if (!it.product_id || !it.quantity) {
        return NextResponse.json({ error: 'each item must include product_id and quantity' }, { status: 400 })
      }
      const { data: product } = await supabase
        .from('products')
        .select('price, sale_price')
        .eq('id', it.product_id)
        .single()
      const unit = (product?.sale_price ?? product?.price) as number
      subtotal += unit * Number(it.quantity)
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: 'pending',
        total_amount: subtotal,
        subtotal,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        shipping_address_id,
        billing_address_id: billing_address_id || shipping_address_id,
        notes
      })
      .select()
      .single()

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

    const orderItemsPayload = items.map((it: any) => ({
      order_id: (order as any).id,
      product_id: it.product_id,
      variant_id: it.variant_id || null,
      product_name: it.product_name || '',
      product_sku: it.product_sku || null,
      quantity: it.quantity,
      unit_price: it.unit_price || null,
      total_price: it.total_price || null
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


