import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping'

function calculateBestDiscount(price: number, discounts: Array<{ type: DiscountType; value: number; maximum_discount_amount?: number }>) {
  const originalPrice = price
  let maxDiscountAmount = 0
  let best: any = null

  for (const d of discounts) {
    let amount = 0
    if (d.type === 'percentage') {
      amount = (originalPrice * d.value) / 100
      if (typeof d.maximum_discount_amount === 'number') {
        amount = Math.min(amount, d.maximum_discount_amount)
      }
    } else if (d.type === 'fixed_amount') {
      amount = Math.min(d.value, originalPrice)
    } else if (d.type === 'free_shipping') {
      amount = 0
    }
    if (amount > maxDiscountAmount) {
      maxDiscountAmount = amount
      best = d
    }
  }

  const finalPrice = Math.max(0, originalPrice - maxDiscountAmount)
  return { finalPrice, discountAmount: maxDiscountAmount, bestDiscount: best }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { id } = params

    // Fetch product essentials
    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('id, price, category_id, brand_id, vendor_id, is_active')
      .eq('id', id)
      .single()

    if (productErr || !product || !product.is_active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()

    const discounts: any[] = []

    // Global discounts
    const { data: globalDiscounts } = await supabase
      .from('discounts')
      .select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, start_date, end_date, status')
      .eq('is_global', true)
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)

    if (globalDiscounts) discounts.push(...globalDiscounts)

    // Product-specific
    const { data: productSpecific } = await supabase
      .from('discounts')
      .select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, start_date, end_date, status, vendor_product_discounts!inner(product_id, vendor_id)')
      .eq('vendor_product_discounts.product_id', product.id)
      .eq('vendor_product_discounts.vendor_id', product.vendor_id)
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)

    if (productSpecific) discounts.push(...productSpecific)

    // Category-specific
    if (product.category_id) {
      const { data: categorySpecific } = await supabase
        .from('discounts')
        .select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, start_date, end_date, status, vendor_category_discounts!inner(category_id, vendor_id)')
        .eq('vendor_category_discounts.category_id', product.category_id)
        .eq('vendor_category_discounts.vendor_id', product.vendor_id)
        .eq('is_active', true)
        .eq('status', 'active')
        .lte('start_date', nowIso)
        .or(`end_date.is.null,end_date.gte.${nowIso}`)
      if (categorySpecific) discounts.push(...categorySpecific)
    }

    // Brand-specific
    if (product.brand_id) {
      const { data: brandSpecific } = await supabase
        .from('discounts')
        .select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, start_date, end_date, status, vendor_brand_discounts!inner(brand_id, vendor_id)')
        .eq('vendor_brand_discounts.brand_id', product.brand_id)
        .eq('vendor_brand_discounts.vendor_id', product.vendor_id)
        .eq('is_active', true)
        .eq('status', 'active')
        .lte('start_date', nowIso)
        .or(`end_date.is.null,end_date.gte.${nowIso}`)
      if (brandSpecific) discounts.push(...brandSpecific)
    }

    // Vendor-specific
    if (product.vendor_id) {
      const { data: vendorSpecific } = await supabase
        .from('discounts')
        .select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, start_date, end_date, status')
        .eq('vendor_id', product.vendor_id)
        .eq('is_active', true)
        .eq('status', 'active')
        .lte('start_date', nowIso)
        .or(`end_date.is.null,end_date.gte.${nowIso}`)
      if (vendorSpecific) discounts.push(...vendorSpecific)
    }

    // Deduplicate by id
    const uniqueDiscounts = discounts.filter((d, i, arr) => i === arr.findIndex(x => x.id === d.id))

    const { finalPrice, discountAmount, bestDiscount } = calculateBestDiscount(product.price, uniqueDiscounts)

    return NextResponse.json({
      productId: product.id,
      price: product.price,
      discounts: uniqueDiscounts,
      bestDiscount,
      finalPrice,
      discountAmount,
      hasDiscount: discountAmount > 0
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


























