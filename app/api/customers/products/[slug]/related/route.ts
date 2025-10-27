import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { slug } = params

    // Fetch current product to get category and brand
    const { data: current, error: currentErr } = await supabase
      .from('products')
      .select('id, category_id, brand_id')
      .eq('slug', slug)
      .single()

    if (currentErr || !current) {
      return NextResponse.json({ items: [] })
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        images:product_images(*)
      `)
      .eq('is_active', true)
      .neq('id', current.id)
      .or(`category_id.eq.${current.category_id},brand_id.eq.${current.brand_id}`)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


