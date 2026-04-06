import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'
import { dispatchOrderPlacedNotifications } from '@/lib/notifications/server'

/**
 * Called after the storefront creates an order via the browser Supabase client (checkout page).
 * Verifies the order belongs to the caller, then inserts app_notifications using the service role.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const userId = await getAuthenticatedUserId(request)
    const body = await request.json().catch(() => ({}))
    const orderId = typeof body?.orderId === 'string' ? body.orderId : ''

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, user_id, order_number')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if ((order as { user_id: string }).user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orderNumber = (order as { order_number: string }).order_number
    await dispatchOrderPlacedNotifications(userId, orderNumber)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('order-placed notifications:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
