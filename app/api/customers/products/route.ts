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
    const fetchAll = searchParams.get('all') === 'true'
    
    // If fetching all, skip pagination. Otherwise use pagination with increased limit
    const page = fetchAll ? 1 : Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = fetchAll 
      ? 10000 // Large limit when fetching all (practical limit to prevent memory issues)
      : Math.min(1000, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10))) // Increased max from 50 to 1000

    const from = (page - 1) * pageSize
    const to = fetchAll ? 9999 : from + pageSize - 1 // Large range when fetching all

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

    // When fetching all, don't use range() to get all results
    const { data, error, count } = fetchAll 
      ? await query
      : await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total count if not already fetched
    const totalCount = count ?? (fetchAll ? data?.length ?? 0 : 0)

    return NextResponse.json({
      items: data ?? [],
      pagination: {
        page: fetchAll ? 1 : page,
        page_size: fetchAll ? totalCount : pageSize,
        total: totalCount,
        total_pages: fetchAll ? 1 : (totalCount ? Math.ceil(totalCount / pageSize) : 0)
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}



