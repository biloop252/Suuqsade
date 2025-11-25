import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)

		const { searchParams } = new URL(request.url)
		const status = searchParams.get('status') || ''
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

		let query = supabase
			.from('support_tickets')
			.select(`
				*,
				category:support_categories(id, name, slug)
			`)
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (status) {
			query = query.eq('status', status)
		}

		const { data, error } = await query
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ items: data ?? [] })
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)
		const body = await request.json()

		const {
			subject,
			description,
			category_id = null,
			priority = 'medium',
			order_id = null,
			product_id = null,
			is_urgent = false
		} = body || {}

		if (!subject || !description) {
			return NextResponse.json({ error: 'subject and description are required' }, { status: 400 })
		}

		const ticketNumber = `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

		const { data, error } = await supabase
			.from('support_tickets')
			.insert({
				ticket_number: ticketNumber,
				user_id: userId,
				category_id,
				subject,
				description,
				status: 'open',
				priority,
				order_id,
				product_id,
				is_urgent
			})
			.select(`
				*,
				category:support_categories(id, name, slug)
			`)
			.single()

		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ ticket: data }, { status: 201 })
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
		 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}






















