import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)

		// Profile
		const { data: profile } = await supabase
			.from('profiles')
			.select('id, email, first_name, last_name, avatar_url, phone')
			.eq('id', userId)
			.single()

		// Orders (recent 5)
		const { data: orders } = await supabase
			.from('orders')
			.select('id, order_number, status, total_amount, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5)

		// Addresses
		const { data: addresses } = await supabase
			.from('addresses')
			.select('id, type, first_name, last_name, city, country, is_default, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })

		// Reviews (recent 5)
		const { data: reviews } = await supabase
			.from('reviews')
			.select('id, product_id, rating, title, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5)

		// Support tickets (recent 5) + counts
		const { data: tickets } = await supabase
			.from('support_tickets')
			.select('id, ticket_number, subject, status, priority, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5)

		const { data: openCountData } = await supabase
			.from('support_tickets')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('status', 'open')

		const { data: closedCountData } = await supabase
			.from('support_tickets')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('status', 'closed')

		return NextResponse.json({
			profile: profile || null,
			orders: orders || [],
			addresses: addresses || [],
			reviews: reviews || [],
			tickets: tickets || [],
			metrics: {
				open_tickets: (openCountData as any)?.length ?? 0,
				closed_tickets: (closedCountData as any)?.length ?? 0
			}
		})
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}






















