import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createRequestClient(_request)
    const { slug } = params

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        vendor:vendor_profiles(business_name, business_description, city, country, logo_url),
        images:product_images(*),
        variants:product_variants(*),
        reviews:reviews(*),
        tag_assignments:product_tag_assignments(tag:product_tags(*))
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

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


