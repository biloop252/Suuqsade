import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*),
          variants:product_variants(*)
        )
      `)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const body = await request.json()
    const { product_id, variant_id = null, quantity = 1 } = body || {}

    if (!product_id || quantity <= 0) {
      return NextResponse.json({ error: 'product_id and positive quantity required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', product_id)
      .eq('variant_id', variant_id)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: (existing as any).quantity + quantity })
        .eq('id', (existing as any).id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ item: data })
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id, variant_id, quantity })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    await getAuthenticatedUserId(request)
    const body = await request.json()
    const { id, quantity } = body || {}
    if (!id || typeof quantity !== 'number') {
      return NextResponse.json({ error: 'id and quantity required' }, { status: 400 })
    }
    if (quantity <= 0) {
      const { error } = await supabase.from('cart_items').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const clearAll = searchParams.get('all') === 'true'

    if (clearAll) {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabase.from('cart_items').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


