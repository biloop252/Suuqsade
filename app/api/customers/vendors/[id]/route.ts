import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { id } = params

    const { data: vendor, error } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: products } = await supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        category:categories(*),
        brand:brands(*)
      `)
      .eq('vendor_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24)

    return NextResponse.json({ vendor, products: products ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


