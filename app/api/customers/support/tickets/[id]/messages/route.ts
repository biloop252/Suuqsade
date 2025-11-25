import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

async function ensureTicketOwnership(supabase: any, ticketId: string, userId: string) {
	const { data: ticket, error } = await supabase
		.from('support_tickets')
		.select('id, user_id')
		.eq('id', ticketId)
		.single()
	if (error || !ticket) return { ok: false, status: 404 }
	if ((ticket as any).user_id !== userId) return { ok: false, status: 403 }
	return { ok: true }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)
		const { id } = params

		const ownership = await ensureTicketOwnership(supabase, id, userId)
		if (!ownership.ok) {
			const status = (ownership as any).status || 403
			return NextResponse.json({ error: status === 404 ? 'Not found' : 'Forbidden' }, { status })
		}

		const { data, error } = await supabase
			.from('support_messages')
			.select('id, ticket_id, user_id, message, attachments, created_at')
			.eq('ticket_id', id)
			.order('created_at', { ascending: true })

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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)
		const { id } = params
		const body = await request.json()

		const ownership = await ensureTicketOwnership(supabase, id, userId)
		if (!ownership.ok) {
			const status = (ownership as any).status || 403
		 return NextResponse.json({ error: status === 404 ? 'Not found' : 'Forbidden' }, { status })
		}

		const { message, attachments = [] } = body || {}
		if (!message || typeof message !== 'string') {
			return NextResponse.json({ error: 'message is required' }, { status: 400 })
		}

		const { data, error } = await supabase
			.from('support_messages')
			.insert({
				ticket_id: id,
				user_id: userId,
				message,
				attachments
			})
			.select('id, ticket_id, user_id, message, attachments, created_at')
			.single()

		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ message: data }, { status: 201 })
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}






















