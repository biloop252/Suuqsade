import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { slug } = params

    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!brand) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: products } = await supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        category:categories(*),
        brand:brands(*)
      `)
      .eq('brand_id', (brand as any).id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24)

    return NextResponse.json({ brand, products: products ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


