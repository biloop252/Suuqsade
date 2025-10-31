import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
	try {
		const supabase = createRequestClient(request)
		const { slug } = params
		const { searchParams } = new URL(request.url)
		const city = (searchParams.get('city') || '').trim()
		const country = (searchParams.get('country') || '').trim()

		if (!city || !country) {
			return NextResponse.json({ error: 'Missing city or country' }, { status: 400 })
		}

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

		// Check delivery zone allowance
		const { data: deliveryZone } = await supabase
			.from('product_delivery_zones')
			.select('is_allowed')
			.eq('product_id', product.id)
			.eq('city', city)
			.eq('country', country)
			.eq('is_allowed', true)
			.single()

		if (!deliveryZone) {
			return NextResponse.json({
				product_id: product.id,
				city,
				country,
				summary: { can_deliver: false, has_free_delivery: false, cheapest_price: 0, fastest_days: 0, total_options: 0, error_message: 'Delivery not allowed to this location' },
				options: []
			})
		}

		// Fetch product delivery options with nested delivery rates + methods
		const { data: options, error: optionsError } = await supabase
			.from('product_delivery_options')
			.select(`
				id,
				is_free_delivery,
				delivery_rate:delivery_rates(
					id,
					pickup_city,
					delivery_city,
					price,
					estimated_min_days,
					estimated_max_days,
					delivery_method:delivery_methods(id, name)
				)
			`)
			.eq('product_id', product.id)
			.eq('delivery_rate.delivery_city', city)
			.eq('delivery_rate.is_active', true)

		if (optionsError) {
			return NextResponse.json({ error: optionsError.message }, { status: 500 })
		}

		const pickupCities = Array.from(new Set((options || []).map((o: any) => o.delivery_rate?.[0]?.pickup_city).filter(Boolean)))
		let pickupLocations: any[] = []
		if (pickupCities.length > 0) {
			const { data: locations } = await supabase
				.from('pickup_locations')
				.select('id, name, city, country')
				.in('city', pickupCities)
				.eq('is_active', true)
			pickupLocations = locations || []
		}

		const transformed = (options || [])
			.filter((o: any) => o.delivery_rate)
			.map((o: any) => {
				const r = o.delivery_rate?.[0]
				const loc = pickupLocations.find(pl => pl.city === r?.pickup_city)
				return {
					pickup_location_id: loc?.id || '',
					pickup_location_name: loc?.name || 'Unknown Location',
					pickup_city: r?.pickup_city || '',
					delivery_method_id: r?.delivery_method?.[0]?.id || '',
					delivery_method_name: r?.delivery_method?.[0]?.name || 'Unknown Method',
					is_free_delivery: o.is_free_delivery,
					delivery_price: r?.price || 0,
					estimated_min_days: r?.estimated_min_days || 0,
					estimated_max_days: r?.estimated_max_days || 0,
				}
			})
			.filter((o: any) => o.pickup_location_id)

		let summary
		if (transformed.length > 0) {
			const hasFreeDelivery = transformed.some((t: any) => t.is_free_delivery)
			const cheapest = Math.min(...transformed.map((t: any) => t.delivery_price))
			const fastest = Math.min(...transformed.map((t: any) => t.estimated_min_days))
			summary = { can_deliver: true, has_free_delivery: hasFreeDelivery, cheapest_price: cheapest, fastest_days: fastest, total_options: transformed.length }
		} else {
			summary = { can_deliver: false, has_free_delivery: false, cheapest_price: 0, fastest_days: 0, total_options: 0, error_message: 'No delivery options available for this location' }
		}

		return NextResponse.json({ product_id: product.id, city, country, summary, options: transformed })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}



