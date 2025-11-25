import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Vendor id is required' }, { status: 400 })
    }

    // Reviews: compute total and positive (rating >= 4) for this vendor's products (approved only)
    const [{ count: totalReviews, error: totalErr }, { count: positiveReviews, error: posErr }] = await Promise.all([
      supabase
        .from('reviews')
        .select('id, products!inner(vendor_id)', { count: 'exact', head: true })
        .eq('is_approved', true)
        .eq('products.vendor_id', id),
      supabase
        .from('reviews')
        .select('id, products!inner(vendor_id)', { count: 'exact', head: true })
        .eq('is_approved', true)
        .gte('rating', 4)
        .eq('products.vendor_id', id),
    ])

    if (totalErr || posErr) {
      return NextResponse.json({ error: 'Failed to compute review stats' }, { status: 500 })
    }

    const total = totalReviews || 0
    const positive = positiveReviews || 0
    const positiveRatingPercent = total > 0 ? Math.round((positive / total) * 100) : 0

    // Average rating (approved reviews only)
    const { data: ratingRows, error: ratingsErr } = await supabase
      .from('reviews')
      .select('rating, products!inner(vendor_id)')
      .eq('is_approved', true)
      .eq('products.vendor_id', id)
      .limit(10000)

    if (ratingsErr) {
      return NextResponse.json({ error: 'Failed to compute average rating' }, { status: 500 })
    }

    const averageRating = (ratingRows || []).length
      ? (ratingRows!.reduce((s: number, r: any) => s + (r?.rating || 0), 0) / ratingRows!.length)
      : 0

    // Products sold: match product page by using RPC get_vendor_units_sold; fallback to join if RPC unavailable
    let productsSold = 0
    try {
      const { data: rpcUnits, error: rpcErr } = await supabase
        .rpc('get_vendor_units_sold', { vendor_uuid: id })
      if (!rpcErr && typeof rpcUnits === 'number') {
        productsSold = Number(rpcUnits)
      } else {
        // Fallback: sum order_items.quantity joined to products by vendor_id (no order status filter to match RPC)
        const { data: items, error: itemsErr } = await supabase
          .from('order_items')
          .select('quantity, products!inner(vendor_id)')
          .eq('products.vendor_id', id)
          .limit(10000)
        if (itemsErr) {
          return NextResponse.json({ error: 'Failed to compute products sold' }, { status: 500 })
        }
        productsSold = (items || []).reduce((sum: number, row: any) => sum + (row?.quantity || 0), 0)
      }
    } catch (_e) {
      // Keep productsSold at 0 on unexpected RPC failure and continue returning other stats
    }

    return NextResponse.json({
      vendorId: id,
      averageRating: Number(averageRating.toFixed(2)),
      positiveRatingPercent,
      positiveReviews: positive,
      totalReviews: total,
      productsSold,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


