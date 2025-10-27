import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const brand = searchParams.get('brand') || ''
    const vendor = searchParams.get('vendor') || ''
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const sort = (searchParams.get('sort') as SortOption) || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10)))

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        vendor:vendor_profiles(business_name, city, country, logo_url),
        images:product_images(*),
        variants:product_variants(*),
        reviews:reviews(rating)
      `, { count: 'exact' })
      .eq('is_active', true)

    if (q) {
      // Search by name or short_description
      query = query.or(
        `name.ilike.%${q}%,short_description.ilike.%${q}%`
      )
    }

    if (category) query = query.eq('category_id', category)
    if (brand) query = query.eq('brand_id', brand)
    if (vendor) query = query.eq('vendor_id', vendor)
    if (minPrice) query = query.gte('price', Number(minPrice))
    if (maxPrice) query = query.lte('price', Number(maxPrice))

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data ?? [],
      pagination: {
        page,
        page_size: pageSize,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / pageSize) : 0
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}



