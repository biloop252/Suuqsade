import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)

		const { searchParams } = new URL(request.url)
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

		const { data, error } = await supabase
			.from('reviews')
			.select(`
				*,
				product:products(
					id,
					name,
					slug,
					images:product_images(
						image_url,
						alt_text,
						is_primary
					)
				)
			`)
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(limit)

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

		const { product_id, rating, title = '', comment = '' } = body || {}

		if (!product_id) {
			return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
		}
		const r = Number(rating)
		if (!Number.isFinite(r) || r < 1 || r > 5) {
			return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 })
		}

		const { data, error } = await supabase
			.from('reviews')
			.insert({
				user_id: userId,
				product_id,
				rating: r,
				title,
				comment
			})
			.select(`
				*,
				product:products(
					id,
					name,
					slug
				)
			`)
			.single()

		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ review: data }, { status: 201 })
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}











