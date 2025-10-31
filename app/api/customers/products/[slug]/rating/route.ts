import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
	try {
		const supabase = createRequestClient(request)
		const { slug } = params

		// Resolve product id
		const { data: product, error: prodErr } = await supabase
			.from('products')
			.select('id')
			.eq('slug', slug)
			.eq('is_active', true)
			.single()

		if (prodErr || !product) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		const { data: reviews, error } = await supabase
			.from('reviews')
			.select('rating')
			.eq('product_id', product.id)
			.eq('is_approved', true)

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		const ratings = (reviews || []).map((r: any) => Number(r.rating) || 0)
		const totalReviews = ratings.length
		const averageRating = totalReviews === 0 ? 0 : ratings.reduce((a, b) => a + b, 0) / totalReviews

		return NextResponse.json({ product_id: product.id, averageRating, totalReviews })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}



