import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

// GET /api/customers/favorites
// Returns wishlist items with nested product details for the authenticated user
export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)

		const { data, error } = await supabase
			.from('wishlist_items')
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
			.order('created_at', { ascending: false })

		if (error) return NextResponse.json({ error: error.message }, { status: 500 })

		// Also return flat list of products for convenience
		const products = (data ?? []).map((it: any) => it?.product).filter(Boolean)
		return NextResponse.json({ items: data ?? [], products })
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

// POST /api/customers/favorites
// Body: { product_id: string }
// Adds a product to the authenticated user's wishlist (idempotent)
export async function POST(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)
		const body = await request.json()
		const { product_id } = body || {}

		if (!product_id) {
			return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
		}

		const { data, error } = await supabase
			.from('wishlist_items')
			.upsert({ user_id: userId, product_id }, { onConflict: 'user_id,product_id' })
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

// DELETE /api/customers/favorites?product_id=... | /api/customers/favorites?all=true
// Removes a single product from wishlist or clears all favorites for the user
export async function DELETE(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)
		const { searchParams } = new URL(request.url)
		const clearAll = searchParams.get('all') === 'true'
		const productId = searchParams.get('product_id')

		if (clearAll) {
			const { error } = await supabase.from('wishlist_items').delete().eq('user_id', userId)
			if (error) return NextResponse.json({ error: error.message }, { status: 500 })
			return NextResponse.json({ ok: true })
		}

		if (!productId) {
			return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
		}

		const { error } = await supabase
			.from('wishlist_items')
			.delete()
			.eq('user_id', userId)
			.eq('product_id', productId)

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


