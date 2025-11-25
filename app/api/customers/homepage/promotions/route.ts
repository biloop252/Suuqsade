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
				action_type,
				action_params,
				created_at,
				updated_at,
				slider_items (
					id,
					promotional_media_id,
					image_url,
					mobile_image_url,
					link_url,
					button_text,
					target,
					display_order,
					is_active,
					action_type,
					action_params,
					created_at,
					updated_at
				)
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

		// Process the data to filter and sort slider_items
		const processedData = (data ?? []).map((item: any) => {
			if (item.slider_items && Array.isArray(item.slider_items)) {
				// Filter active slider items and sort by display_order
				item.slider_items = item.slider_items
					.filter((si: any) => si.is_active === true)
					.sort((a: any, b: any) => {
						if (a.display_order !== b.display_order) {
							return a.display_order - b.display_order
						}
						return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					})
			}
			return item
		})

		return NextResponse.json({ items: processedData })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}



