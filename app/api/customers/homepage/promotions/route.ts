import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

// GET /api/customers/homepage/promotions?position=homepage_top&limit=5
export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const { searchParams } = new URL(request.url)
		const position = searchParams.get('position') || ''
		const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '5', 10)))

		if (!position) {
			return NextResponse.json({ error: 'Missing position' }, { status: 400 })
		}

		const now = new Date().toISOString()
		const { data, error } = await supabase
			.from('promotional_media')
			.select(`
				id,
				title,
				subtitle,
				description,
				media_type,
				image_url,
				mobile_image_url,
				video_url,
				link_url,
				button_text,
				target,
				banner_position,
				display_order,
				background_color,
				text_color,
				is_active,
				start_date,
				end_date,
				language_code,
				created_at,
				updated_at
			`)
			.eq('banner_position', position)
			.eq('is_active', true)
			.or(`start_date.is.null,start_date.lte.${now}`)
			.or(`end_date.is.null,end_date.gte.${now}`)
			.order('display_order', { ascending: true })
			.limit(limit)

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ items: data ?? [] })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}



