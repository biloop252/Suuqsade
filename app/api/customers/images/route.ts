import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)

		const { searchParams } = new URL(request.url)
		const image_type = searchParams.get('type')
		const id = searchParams.get('id')

		let query = supabase
			.from('system_images')
			.select('*')
			.eq('is_active', true)
			.order('image_type', { ascending: true })
			.order('created_at', { ascending: false })

		// Filter by image type if provided
		if (image_type) {
			query = query.eq('image_type', image_type)
		}

		// Filter by id if provided
		if (id) {
			query = query.eq('id', id)
		}

		const { data, error } = await query

		if (error) {
			console.error('Error fetching active images:', error)
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		// If single id requested, return single image object, otherwise return array
		if (id && data && data.length > 0) {
			return NextResponse.json({ image: data[0] })
		}

		return NextResponse.json({ images: data ?? [] })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('Error in GET /api/customers/images:', message)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}








