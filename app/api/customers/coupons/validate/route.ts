import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const body = await request.json()
    const { code, order_amount = 0 } = body || {}
    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 200 })
    }

    const now = new Date()
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return NextResponse.json({ valid: false, reason: 'not_started' })
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }
    if (coupon.minimum_order_amount && Number(order_amount) < Number(coupon.minimum_order_amount)) {
      return NextResponse.json({ valid: false, reason: 'min_amount' })
    }

    const { count } = await supabase
      .from('discount_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('coupon_id', coupon.id)

    if (coupon.usage_limit_per_user && (count ?? 0) >= coupon.usage_limit_per_user) {
      return NextResponse.json({ valid: false, reason: 'usage_limit' })
    }

    return NextResponse.json({ valid: true, coupon })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


