import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  function normalizeOrigin(value: string): string {
    try {
      return new URL(value).origin
    } catch {
      return value.replace(/\/$/, '')
    }
  }

  const requestOriginHeader = request.headers.get('origin') || ''
  const requestOrigin = requestOriginHeader ? normalizeOrigin(requestOriginHeader) : ''

  const envOrigins = [
    process.env.CORS_ALLOW_ORIGINS,
    process.env.NEXT_PUBLIC_ALLOW_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL
  ]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin)

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ].map(normalizeOrigin)

  const allowedOrigins = new Set<string>([...envOrigins, ...defaultOrigins])

  const originHeader = (requestOrigin && allowedOrigins.has(requestOrigin)) 
    ? requestOrigin 
    : '*'
  const allowCredentials = originHeader !== '*'
  const requestHeaders = request.headers.get('access-control-request-headers') || 'Content-Type, Authorization'

  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', originHeader)
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', requestHeaders)
  headers.set('Access-Control-Max-Age', '86400')
  if (allowCredentials) {
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return new NextResponse(null, { status: 204, headers })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const body = await request.json()

    const { coupon_id, order_id, discount_amount } = body || {}

    // Validate required fields
    if (!coupon_id) {
      return NextResponse.json({ error: 'coupon_id is required' }, { status: 400 })
    }
    if (!discount_amount && discount_amount !== 0) {
      return NextResponse.json({ error: 'discount_amount is required' }, { status: 400 })
    }

    // Verify coupon exists and is active
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id, code, is_active, status, used_count, usage_limit, usage_limit_per_user')
      .eq('id', coupon_id)
      .single()

    if (couponError || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    if (!coupon.is_active || coupon.status !== 'active') {
      return NextResponse.json({ error: 'Coupon is not active' }, { status: 400 })
    }

    // Check if usage limit has been reached
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
    }

    // Check per-user usage limit
    const { count: userUsageCount } = await supabase
      .from('discount_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('coupon_id', coupon_id)

    if (coupon.usage_limit_per_user && (userUsageCount ?? 0) >= coupon.usage_limit_per_user) {
      return NextResponse.json({ error: 'Coupon usage limit per user reached' }, { status: 400 })
    }

    // Insert into discount_usage table
    const { data: usageRecord, error: usageError } = await supabase
      .from('discount_usage')
      .insert({
        user_id: userId,
        coupon_id: coupon_id,
        order_id: order_id || null,
        discount_amount: Number(discount_amount),
        used_at: new Date().toISOString()
      })
      .select()
      .single()

    if (usageError) {
      return NextResponse.json({ error: 'Failed to track coupon usage', details: usageError.message }, { status: 500 })
    }

    // Increment coupon used_count using RPC function
    const { error: incrementError } = await supabase.rpc('increment_coupon_usage', {
      coupon_id: coupon_id
    })

    if (incrementError) {
      // If RPC fails, try direct update as fallback
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon_id)

      if (updateError) {
        return NextResponse.json({ 
          error: 'Failed to update coupon usage count', 
          details: updateError.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      usage_record: usageRecord,
      message: 'Coupon usage tracked successfully'
    }, { status: 200 })

  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    let userId: string | null = null
    try {
      userId = await getAuthenticatedUserId(request)
    } catch {
      // Optional auth - continue without user
    }

    const { searchParams } = new URL(request.url)

    const vendorId = searchParams.get('vendor_id') || undefined
    const productId = searchParams.get('product_id') || undefined
    const categoryId = searchParams.get('category_id') || undefined
    const brandId = searchParams.get('brand_id') || undefined
    const includeUserCoupons = searchParams.get('include_user_coupons') === 'true'

    const nowIso = new Date().toISOString()

    // Base query for active coupons - similar to discounts route
    let query = supabase
      .from('coupons')
      .select(`
        id, code, name, description, type, value, maximum_discount_amount,
        minimum_order_amount, usage_limit, usage_limit_per_user, used_count,
        is_global, vendor_id, status, start_date, end_date, is_active,
        created_at, updated_at,
        vendor_product_discounts(product_id, vendor_id),
        vendor_category_discounts(category_id, vendor_id),
        vendor_brand_discounts(brand_id, vendor_id)
      `)
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', nowIso)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)

    // Filter scoping
    if (vendorId) {
      query = query.or(`is_global.eq.true,vendor_id.eq.${vendorId}`)
    }

    // Filter by product, category, or brand via join tables
    if (productId) {
      query = query.eq('vendor_product_discounts.product_id', productId)
    }
    if (categoryId) {
      query = query.eq('vendor_category_discounts.category_id', categoryId)
    }
    if (brandId) {
      query = query.eq('vendor_brand_discounts.brand_id', brandId)
    }

    const { data: coupons, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    // Filter out coupons that have exceeded usage limits
    let validCoupons = (coupons || []).filter((coupon: any) => {
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return false
      }
      return true
    })

    // If user is authenticated and requested user coupons, include them
    if (userId && includeUserCoupons) {
      const { data: userCoupons } = await supabase
        .from('user_coupons')
        .select(`
          id, is_used, used_at, created_at,
          coupon:coupons(
            id, code, name, description, type, value, maximum_discount_amount,
            minimum_order_amount, usage_limit, usage_limit_per_user, used_count,
            is_global, vendor_id, status, start_date, end_date, is_active
          )
        `)
        .eq('user_id', userId)
        .eq('is_used', false)

      if (userCoupons) {
        const activeUserCoupons = userCoupons
          .filter((uc: any) => {
            if (!uc.coupon) return false
            const coupon = uc.coupon
            // Check if coupon is active and within date range
            if (!coupon.is_active || coupon.status !== 'active') return false
            const now = new Date()
            if (coupon.start_date && new Date(coupon.start_date) > now) return false
            if (coupon.end_date && new Date(coupon.end_date) < now) return false
            // Check usage limit
            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return false
            return true
          })
          .map((uc: any) => ({
            ...uc.coupon,
            user_coupon_id: uc.id,
            is_user_specific: true
          }))

        // Merge avoiding duplicates
        const existingCodes = new Set(validCoupons.map((c: any) => c.code))
        activeUserCoupons.forEach((uc: any) => {
          if (!existingCodes.has(uc.code)) {
            validCoupons.push(uc)
          }
        })
      }
    }

    // Check user's usage count for each coupon if authenticated
    const couponsWithUsage = await Promise.all(
      validCoupons.map(async (coupon: any) => {
        const result: any = { ...coupon }

        if (userId) {
          // Check how many times user has used this coupon
          const { count } = await supabase
            .from('discount_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('coupon_id', coupon.id)

          const userUsageCount = count ?? 0
          const userCanUse = !coupon.usage_limit_per_user || userUsageCount < coupon.usage_limit_per_user

          result.user_usage_count = userUsageCount
          result.user_can_use = userCanUse
          result.remaining_uses = coupon.usage_limit_per_user 
            ? Math.max(0, coupon.usage_limit_per_user - userUsageCount)
            : null
        } else {
          result.user_usage_count = 0
          result.user_can_use = true
          result.remaining_uses = null
        }

        return result
      })
    )

    // Filter out coupons user can't use (if authenticated)
    const availableCoupons = userId
      ? couponsWithUsage.filter((c: any) => c.user_can_use !== false)
      : couponsWithUsage

    return NextResponse.json({ 
      coupons: availableCoupons,
      count: availableCoupons.length
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

