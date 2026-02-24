import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createRequestClient(_request)
    const { slug } = params
    // Param can be slug (product name slug) or product id (e.g. from promotion links)
    const isUuid = UUID_REGEX.test(slug)

    const query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        vendor:vendor_profiles(id, business_name, business_description, city, country, logo_url),
        images:product_images(*),
        variants:product_variants(*),
        reviews:reviews(*),
        tag_assignments:product_tag_assignments(tag:product_tags(*))
      `)
      .eq('is_active', true)
    const { data: product, error } = await (isUuid ? query.eq('id', slug) : query.eq('slug', slug)).single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


