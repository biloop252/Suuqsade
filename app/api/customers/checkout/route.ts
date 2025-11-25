import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

type CheckoutItemInput = {
  product_id: string
  variant_id?: string | null
  quantity: number
}

async function loadProductsPricing(supabase: any, items: CheckoutItemInput[]) {
  const productIds = Array.from(new Set(items.map(i => i.product_id)))
  const variantIds = Array.from(new Set(items.map(i => i.variant_id).filter(Boolean))) as string[]

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabase
        .from('products')
        .select('id, name, sku, price, sale_price')
        .in('id', productIds),
      variantIds.length > 0
        ? supabase
            .from('product_variants')
            .select('id, price, sale_price')
            .in('id', variantIds)
        : Promise.resolve({ data: [], error: null })
    ])

  if (productsError) throw new Error(productsError.message)
  if (variantsError) throw new Error(variantsError.message)

  const productMap = new Map<string, any>()
  const variantMap = new Map<string, any>()
  for (const p of products ?? []) productMap.set(p.id, p)
  for (const v of variants ?? []) variantMap.set(v.id, v)

  return { productMap, variantMap }
}

function computeUnitPrice(product: any | null, variant: any | null): number {
  const fromVariant =
    variant && (variant.sale_price != null ? Number(variant.sale_price) : variant.price != null ? Number(variant.price) : null)
  if (fromVariant != null) return fromVariant
  if (!product) return 0
  return product.sale_price != null ? Number(product.sale_price) : Number(product.price)
}

function computeTotals(itemsWithPrices: Array<{ quantity: number; unit_price: number }>) {
  const subtotal = itemsWithPrices.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
  return { subtotal }
}

async function validateAndLoadCoupon(supabase: any, userId: string, code?: string | null, orderAmount: number = 0) {
  if (!code) return { coupon: null, discountAmount: 0, freeShipping: false }

  const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', code).eq('is_active', true).single()
  if (error || !coupon) {
    return { coupon: null, discountAmount: 0, freeShipping: false }
  }

  const now = new Date()
  if (coupon.start_date && new Date(coupon.start_date) > now) return { coupon: null, discountAmount: 0, freeShipping: false }
  if (coupon.end_date && new Date(coupon.end_date) < now) return { coupon: null, discountAmount: 0, freeShipping: false }
  if (coupon.minimum_order_amount && Number(orderAmount) < Number(coupon.minimum_order_amount)) {
    return { coupon: null, discountAmount: 0, freeShipping: false }
  }

  // Per-user usage limit
  const { count } = await supabase
    .from('discount_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('coupon_id', coupon.id)

  if (coupon.usage_limit_per_user && (count ?? 0) >= coupon.usage_limit_per_user) {
    return { coupon: null, discountAmount: 0, freeShipping: false }
  }

  // Calculate discount
  let discountAmount = 0
  let freeShipping = false
  if (coupon.type === 'percentage') {
    const pct = (orderAmount * Number(coupon.value)) / 100
    discountAmount = coupon.maximum_discount_amount ? Math.min(pct, Number(coupon.maximum_discount_amount)) : pct
  } else if (coupon.type === 'fixed_amount') {
    discountAmount = Math.min(Number(coupon.value), orderAmount)
  } else if (coupon.type === 'free_shipping') {
    freeShipping = true
  }

  return { coupon, discountAmount, freeShipping }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const body = await request.json()

    const {
      items: rawItems,
      shipping_address_id,
      billing_address_id,
      coupon_code,
      payment_method = 'cod'
    }: {
      items?: CheckoutItemInput[]
      shipping_address_id?: string
      billing_address_id?: string
      coupon_code?: string
      payment_method?: string
    } = body || {}

    // If items are not provided, use current cart
    let items: CheckoutItemInput[] = Array.isArray(rawItems) ? rawItems : []
    if (items.length === 0) {
      const { data: cart, error: cartError } = await supabase
        .from('cart_items')
        .select('product_id, variant_id, quantity')
        .eq('user_id', userId)
      if (cartError) return NextResponse.json({ error: cartError.message }, { status: 500 })
      items = (cart ?? []).map((c: any) => ({
        product_id: c.product_id,
        variant_id: c.variant_id,
        quantity: Number(c.quantity) || 1
      }))
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items to checkout' }, { status: 400 })
    }

    const { productMap, variantMap } = await loadProductsPricing(supabase, items)
    const detailedItems = items.map(it => {
      const product = productMap.get(it.product_id) ?? null
      const variant = it.variant_id ? variantMap.get(it.variant_id) ?? null : null
      const unit_price = computeUnitPrice(product, variant)
      const total_price = unit_price * Number(it.quantity)
      return {
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
        quantity: Number(it.quantity),
        unit_price,
        total_price,
        product_name: product?.name ?? '',
        product_sku: variant?.sku ?? product?.sku ?? null
      }
    })

    const { subtotal } = computeTotals(detailedItems)

    // Coupon application
    const { coupon, discountAmount, freeShipping } = await validateAndLoadCoupon(supabase, userId, coupon_code, subtotal)

    // For now, taxes and shipping are simplified. Integrate delivery/tax services as needed.
    const tax_amount = 0
    const shipping_amount = freeShipping ? 0 : 0
    const discount_amount = Number(discountAmount)
    const total_amount = Math.max(0, subtotal - discount_amount + shipping_amount + tax_amount)

    return NextResponse.json({
      items: detailedItems,
      summary: {
        subtotal,
        discount_amount,
        shipping_amount,
        tax_amount,
        total_amount
      },
      shipping_address_id: shipping_address_id || null,
      billing_address_id: billing_address_id || shipping_address_id || null,
      payment_method,
      coupon: coupon ? { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value } : null
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Optional: GET to quickly quote current cart without body
export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    await getAuthenticatedUserId(request)
    // Delegate to POST with empty body to use cart
    const fakePost = new Request(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify({}) })
    // @ts-ignore — reuse handler
    return await POST(fakePost as unknown as NextRequest)
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}















