import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

// City normalization helpers (mirror client logic)
const CITY_ALIASES: Record<string, string> = {
  // Known alias examples
  'hargeysa': 'hargeisa'
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function normalizeCityValue(value: string | undefined | null): string {
  if (!value) return ''
  const withoutAccents = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return withoutAccents
    .trim()
    .toLowerCase()
    .replace(/\bcity\b/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function canonicalizeCity(value: string | undefined | null): string {
  const normalized = normalizeCityValue(value)
  return CITY_ALIASES[normalized] || normalized
}

function isCityMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  const ca = canonicalizeCity(a)
  const cb = canonicalizeCity(b)
  if (!ca || !cb) return false
  return ca === cb || ca.includes(cb) || cb.includes(ca)
}

function coerceRates(rates: any): any[] {
  if (Array.isArray(rates)) return rates
  if (rates == null) return []
  return [rates]
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { slug } = params

    const { searchParams } = new URL(request.url)
    const deliveryCity = searchParams.get('city') || ''
    const deliveryCountry = searchParams.get('country') || ''

    if (!slug || !deliveryCity || !deliveryCountry) {
      return NextResponse.json({ error: 'Missing required params: slug, city, country' }, { status: 400 })
    }

    // Resolve product id from slug or id-like param
    let productId = ''
    if (isUuid(slug)) {
      // Treat as product id
      const { data: productById, error: productByIdError } = await supabase
        .from('products')
        .select('id')
        .eq('id', slug)
        .eq('is_active', true)
        .single()

      if (productByIdError) {
        if ((productByIdError as any).code === 'PGRST116') {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Unable to resolve product' }, { status: 500 })
      }
      if (!productById) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      productId = productById.id as string
    } else {
      // Resolve via slug
      const { data: productBySlug, error: productBySlugError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (productBySlugError) {
        if ((productBySlugError as any).code === 'PGRST116') {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Unable to resolve product' }, { status: 500 })
      }
      if (!productBySlug) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      productId = productBySlug.id as string
    }

    // Optional zone check (non-blocking)
    const { data: deliveryZone } = await supabase
      .from('product_delivery_zones')
      .select('is_allowed')
      .eq('product_id', productId)
      .eq('city', deliveryCity)
      .eq('country', deliveryCountry)
      .eq('is_allowed', true)
      .maybeSingle()

    const zoneAllowed = Boolean(deliveryZone?.is_allowed)

    // Fetch options and nested active delivery rates
    const { data: options, error: optionsError } = await supabase
      .from('product_delivery_options')
      .select(`
        id,
        is_free_delivery,
        delivery_rate:delivery_rates(
          id,
          pickup_city,
          delivery_city,
          is_active,
          price,
          estimated_min_days,
          estimated_max_days,
          delivery_method:delivery_methods(
            id,
            name
          )
        )
      `)
      .eq('product_id', productId)
      .eq('delivery_rate.is_active', true)

    if (optionsError) {
      return NextResponse.json({ error: 'Unable to fetch delivery options' }, { status: 500 })
    }

    // Filter options for any rate matching the destination city
    const optionsForCity = (options || [])
      .map((opt: any) => {
        const matchingRate = coerceRates(opt?.delivery_rate).find((r: any) =>
          isCityMatch(r?.delivery_city, deliveryCity)
        )
        return matchingRate ? { ...opt, _matching_rate: matchingRate } : null
      })
      .filter(Boolean) as any[]

    // Fetch pickup locations for matching pickup cities
    const pickupCities = Array.from(new Set(optionsForCity.map((opt: any) => opt._matching_rate?.pickup_city).filter(Boolean)))

    let pickupLocations: any[] = []
    if (pickupCities.length > 0) {
      const { data: locations } = await supabase
        .from('pickup_locations')
        .select('id, name, city, country')
        .in('city', pickupCities)
        .eq('is_active', true)
      pickupLocations = locations || []
    }

    // Transform to response DTO
    const transformedOptions = optionsForCity
      .filter((opt: any) => opt._matching_rate)
      .map((opt: any) => {
        const rate = opt._matching_rate
        const pickupLocation = pickupLocations.find(pl => pl.city === rate?.pickup_city)
        
        // Handle delivery_method - it can be an object (from foreign key join) or array
        const deliveryMethod = Array.isArray(rate?.delivery_method) 
          ? rate?.delivery_method?.[0] 
          : rate?.delivery_method
        
        return {
          pickup_location_id: pickupLocation?.id || '',
          pickup_location_name: pickupLocation?.name || 'Unknown Location',
          pickup_city: rate?.pickup_city || '',
          delivery_method_id: deliveryMethod?.id || '',
          delivery_method_name: deliveryMethod?.name || 'Unknown Method',
          is_free_delivery: opt.is_free_delivery,
          delivery_price: rate?.price || 0,
          estimated_min_days: rate?.estimated_min_days || 0,
          estimated_max_days: rate?.estimated_max_days || 0
        }
      })
      .filter((opt: any) => opt.pickup_location_id)

    // Build summary
    let summary
    if (transformedOptions.length > 0) {
      const hasFreeDelivery = transformedOptions.some((o: any) => o.is_free_delivery)
      const cheapestPrice = Math.min(...transformedOptions.map((o: any) => o.delivery_price))
      const fastestDays = Math.min(...transformedOptions.map((o: any) => o.estimated_min_days))
      summary = {
        can_deliver: true,
        has_free_delivery: hasFreeDelivery,
        cheapest_price: cheapestPrice,
        fastest_days: fastestDays,
        total_options: transformedOptions.length
      }
    } else {
      summary = {
        can_deliver: false,
        has_free_delivery: false,
        cheapest_price: 0,
        fastest_days: 0,
        total_options: 0,
        error_message: zoneAllowed ? 'No delivery options available for this location' : 'Delivery not allowed to this location'
      }
    }

    return NextResponse.json({
      summary,
      options: transformedOptions,
      meta: {
        product_id: productId,
        product_slug: slug,
        city: deliveryCity,
        city_canonical: canonicalizeCity(deliveryCity),
        country: deliveryCountry,
        zone_allowed: zoneAllowed
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}




