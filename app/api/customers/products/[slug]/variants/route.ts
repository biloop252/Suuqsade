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

		const { data: variants, error } = await supabase
			.from('product_variants')
			.select('*')
			.eq('product_id', product.id)
			.eq('is_active', true)
			.order('created_at', { ascending: true })

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ product_id: product.id, variants: variants ?? [] })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}



