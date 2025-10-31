import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)

		// Fetch active homepage sections in display order
		const now = new Date().toISOString()
		const { data: sections, error: sectionsError } = await supabase
			.from('homepage_sections')
			.select('*')
			.eq('is_active', true)
			.or(`start_date.is.null,start_date.lte.${now}`)
			.or(`end_date.is.null,end_date.gte.${now}`)
			.order('display_order', { ascending: true })
			.order('created_at', { ascending: false })

		if (sectionsError) {
			return NextResponse.json({ error: sectionsError.message }, { status: 500 })
		}

		if (!sections || sections.length === 0) {
			return NextResponse.json({ sections: [] })
		}

		// Helper to build base product select
		const baseProductSelect = `
			*,
			category:categories(*),
			brand:brands(*),
			images:product_images(*),
			variants:product_variants(*),
			reviews:reviews(*)
		`

		// For each section, fetch products according to the section type
		const sectionResults = await Promise.all(
			sections.map(async (s: any) => {
				let query = supabase
					.from('products')
					.select(baseProductSelect)
					.eq('is_active', true)

				switch (s.section_type as string) {
					case 'category':
						if (!s.category_id) return { ...s, products: [] }
						query = query.eq('category_id', s.category_id)
						break
					case 'brand':
						if (!s.brand_id) return { ...s, products: [] }
						query = query.eq('brand_id', s.brand_id)
						break
					case 'tag': {
						if (!s.tag_id) return { ...s, products: [] }
						const { data: tagRows, error: tagErr } = await supabase
							.from('product_tag_assignments')
							.select('product_id')
							.eq('tag_id', s.tag_id)
						if (tagErr) return { ...s, products: [] }
						const ids = (tagRows || []).map((r: any) => r.product_id).filter(Boolean)
						if (ids.length === 0) return { ...s, products: [] }
						query = query.in('id', ids)
						break
					}
					case 'popular':
						query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
						break
					case 'trending':
						query = query.order('created_at', { ascending: false })
						break
					case 'new_arrivals':
						query = query.order('created_at', { ascending: false })
						break
					case 'best_selling':
						// Fetch more; client can sort by reviews count if needed
						query = query.order('created_at', { ascending: false })
						break
					case 'recommended':
						query = query.order('created_at', { ascending: false })
						break
					case 'flash_deals':
						query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
						break
					default:
						query = query.order('created_at', { ascending: false })
				}

				const limit = Number(s.product_limit) && s.product_limit > 0 ? Number(s.product_limit) : 12
				const fetchLimit = s.section_type === 'best_selling' ? Math.max(24, limit) : limit
				const { data: products, error: productsError } = await query.limit(fetchLimit)
				if (productsError) return { ...s, products: [] }

				let items = products || []
				if (s.section_type === 'best_selling') {
					// Approximate best-selling: by reviews count desc
					items = (items as any[])
						.map(p => ({ p, count: (p.reviews || []).length }))
						.sort((a, b) => b.count - a.count)
						.map(x => x.p)
				}
				if (items.length > limit) items = items.slice(0, limit)
				return { ...s, products: items }
			})
		)

		return NextResponse.json({ sections: sectionResults })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}



