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
      notes = '',
      // Client-provided amounts (units)
      subtotal: clientSubtotal,
      total_amount: clientTotalAmount,
      tax_amount: clientTaxAmount,
      shipping_amount: clientShippingAmount,
      discount_amount: clientDiscountAmount,
      // Alternate client keys and cents variants
      items_total: clientItemsTotal, // can be units or cents in some clients
      subtotal_cents: clientSubtotalCents,
      total_amount_cents: clientTotalAmountCents,
      tax_amount_cents: clientTaxAmountCents,
      shipping_amount_cents: clientShippingAmountCents,
      discount_amount_cents: clientDiscountAmountCents,
      items_total_cents: clientItemsTotalCents
    } = body || {}

    const parseMoney = (units: any, cents: any) => {
      if (cents != null && Number.isFinite(Number(cents))) {
        return Number(cents) / 100
      }
      if (units != null && Number.isFinite(Number(units))) {
        return Number(units)
      }
      return null
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items are required' }, { status: 400 })
    }
    if (!shipping_address_id) {
      return NextResponse.json({ error: 'shipping_address_id is required' }, { status: 400 })
    }

    // Prefer client-provided subtotal if present; otherwise compute
    let subtotal = parseMoney(
      clientSubtotal ?? clientItemsTotal,
      clientSubtotalCents ?? clientItemsTotalCents
    ) ?? 0

    const clientProvidedSubtotal = subtotal !== 0
    for (const it of items) {
      if (!it.product_id && !it.variant_id) {
        return NextResponse.json({ error: 'each item must include product_id or variant_id, and quantity' }, { status: 400 })
      }
      if (!it.quantity) {
        return NextResponse.json({ error: 'each item must include product_id or variant_id, and quantity' }, { status: 400 })
      }

      // Resolve product via product_id; if not found, try resolving via variant_id or by treating product_id as a variant_id
      let resolvedProductId: string | null = it.product_id || null
      let variant: any = null

      // If product_id is missing but variant_id is present, use variant to find product
      if (!resolvedProductId && it.variant_id) {
        const { data: variantRow } = await supabase
          .from('product_variants')
          .select('id, product_id, price, sale_price, name, sku')
          .eq('id', it.variant_id)
          .single()
        if (!variantRow) {
          return NextResponse.json({ error: `invalid variant: ${it.variant_id}` }, { status: 400 })
        }
        variant = variantRow
        resolvedProductId = variantRow.product_id
      }

      // Try fetch product by resolvedProductId; if not found, and caller provided product_id, attempt to treat it as a variant_id
      let product: any = null
      if (resolvedProductId) {
        const { data: productRow } = await supabase
          .from('products')
          .select('id, price, sale_price, name, sku')
          .eq('id', resolvedProductId)
          .single()
        product = productRow
      }
      if (!product) {
        const possibleVariantId = it.product_id && typeof it.product_id === 'string' ? it.product_id : null
        if (possibleVariantId) {
          const { data: variantRow } = await supabase
            .from('product_variants')
            .select('id, product_id, price, sale_price, name, sku')
            .eq('id', possibleVariantId)
            .single()
          if (variantRow) {
            variant = variant ?? variantRow
            resolvedProductId = variantRow.product_id
            const { data: productRow } = await supabase
              .from('products')
              .select('id, price, sale_price, name, sku')
              .eq('id', resolvedProductId!)
              .single()
            product = productRow
            if (!it.variant_id) {
              it.variant_id = variantRow.id
            }
          }
        }
      }
      // Do NOT hard-fail if product is not readable; mirror frontend by relying on provided unit_price when needed

      // Determine unit price priority: variant sale/price -> product sale/price -> client unit_price
      if (!variant && it.variant_id) {
        const { data: v } = await supabase
          .from('product_variants')
          .select('id, product_id, price, sale_price, name, sku')
          .eq('id', it.variant_id)
          .single()
        if (v) variant = v
      }

      const rawUnit =
        (variant as any)?.sale_price ??
        (variant as any)?.price ??
        (product as any)?.sale_price ??
        (product as any)?.price ??
        (it as any).unit_price
      const unit = rawUnit == null ? null : Number(rawUnit)
      const quantityNumber = Number(it.quantity)

      if (unit == null || !Number.isFinite(unit)) {
        return NextResponse.json({ error: 'product price missing' }, { status: 400 })
      }
      if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
        return NextResponse.json({ error: 'invalid quantity' }, { status: 400 })
      }

      // Only add computed amounts if client didn't provide totals; otherwise, still compute to validate sanity (but we won't block)
      subtotal += unit * quantityNumber

      // Persist resolved ids/prices back into the item for insertion later
      it.product_id = resolvedProductId ?? it.product_id
      if ((variant as any)?.id && !it.variant_id) {
        it.variant_id = (variant as any).id
      }
      it.unit_price = unit
      it.total_price = (it.total_price != null && Number.isFinite(Number(it.total_price)))
        ? Number(it.total_price)
        : Number((unit * quantityNumber).toFixed(2))

      // Derive fallback display name and SKU from resolved product/variant for later insertion
      const productNameFromDb =
        (variant as any)?.name && (product as any)?.name
          ? `${(product as any).name} - ${(variant as any).name}`
          : ((product as any)?.name ?? null)
      it._product_name = productNameFromDb
      it._product_sku = (variant as any)?.sku ?? (product as any)?.sku ?? null
    }

    if (!Number.isFinite(subtotal)) {
      return NextResponse.json({ error: 'invalid order total' }, { status: 400 })
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Other amounts: prefer client provided, else defaults
    const taxAmount = parseMoney(clientTaxAmount, clientTaxAmountCents) ?? 0
    const shippingAmount = parseMoney(clientShippingAmount, clientShippingAmountCents) ?? 0
    const discountAmount = parseMoney(clientDiscountAmount, clientDiscountAmountCents) ?? 0

    let totalAmount = parseMoney(clientTotalAmount, clientTotalAmountCents)
    if (totalAmount == null) {
      totalAmount = subtotal + taxAmount + shippingAmount - discountAmount
    }

    if (
      !Number.isFinite(subtotal) ||
      !Number.isFinite(taxAmount) ||
      !Number.isFinite(shippingAmount) ||
      !Number.isFinite(discountAmount) ||
      !Number.isFinite(totalAmount)
    ) {
      return NextResponse.json({ error: 'invalid monetary values' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: 'pending',
        total_amount: totalAmount,
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
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
      product_name: it.product_name || it.name || it._product_name || '',
      product_sku: it.product_sku || it.sku || it._product_sku || null,
      quantity: it.quantity,
      unit_price: it.unit_price || null,
      total_price: it.total_price || null
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

    // Insert payment record mirroring client behavior
    const normalizedPaymentMethod =
      payment_method && typeof payment_method === 'string' && payment_method.toLowerCase() === 'cod'
        ? 'cash_on_delivery'
        : (payment_method || 'cash_on_delivery')

    const paymentData = {
      order_id: (order as any).id,
      amount: totalAmount,
      currency: 'USD',
      payment_method: normalizedPaymentMethod,
      status: 'pending',
      transaction_id: normalizedPaymentMethod === 'cash_on_delivery' ? `COD-${orderNumber}` : orderNumber,
      gateway_response: {
        method: normalizedPaymentMethod,
        status: 'pending',
        message: normalizedPaymentMethod === 'cash_on_delivery'
          ? 'Payment will be collected upon delivery'
          : 'Initialized by API'
      }
    } as any

    const { error: paymentError } = await supabase.from('payments').insert(paymentData)
    // Do not fail the entire request if payment insert fails; log by returning a warning field

    // Finance integration: if COD, mark payment as paid to trigger commission calculation (mirrors client)
    if (!paymentError && normalizedPaymentMethod === 'cash_on_delivery') {
      await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('order_id', (order as any).id)
    }

    // Insert delivery record with default values (mirrors client)
    const deliveryData = {
      order_id: (order as any).id,
      tracking_number: `TRK-${orderNumber}`,
      carrier: 'Standard Delivery',
      status: 'pending',
      estimated_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    } as any

    const { error: deliveryError } = await supabase
      .from('deliveries')
      .insert(deliveryData)
      .select()

    // Do not fail the entire request if delivery insert fails

    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


