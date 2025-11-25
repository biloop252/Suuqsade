import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const { searchParams } = new URL(request.url)

    const vendorId = searchParams.get('vendor_id') || undefined
    const productId = searchParams.get('product_id') || undefined
    const categoryId = searchParams.get('category_id') || undefined
    const brandId = searchParams.get('brand_id') || undefined

    const nowIso = new Date().toISOString()
    let query = supabase
      .from('discounts')
      .select(`
        id, name, description, type, value, maximum_discount_amount,
        is_global, vendor_id, status, start_date, end_date, is_active,
        vendor_product_discounts(product_id, vendor_id),
        vendor_category_discounts(category_id, vendor_id),
        vendor_brand_discounts(brand_id, vendor_id)
      `)
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)

    // Filter scoping
    if (vendorId) {
      // A discount is applicable if it's global or for this vendor or linked via join tables
      query = query.or(
        `is_global.eq.true,vendor_id.eq.${vendorId}`
      )
    }

    if (productId) {
      query = query.eq('vendor_product_discounts.product_id', productId)
    }
    if (categoryId) {
      query = query.eq('vendor_category_discounts.category_id', categoryId)
    }
    if (brandId) {
      query = query.eq('vendor_brand_discounts.brand_id', brandId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 })
    }

    return NextResponse.json({ discounts: data || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


























