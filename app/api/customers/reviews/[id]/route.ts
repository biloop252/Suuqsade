import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)
		const { id } = params
		const body = await request.json()

		// Ensure review belongs to user
		const { data: existing, error: fetchErr } = await supabase
			.from('reviews')
			.select('id, user_id')
			.eq('id', id)
			.single()
		if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		if ((existing as any).user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

		const updateData: any = {}
		if (body.title != null) updateData.title = String(body.title)
		if (body.comment != null) updateData.comment = String(body.comment)
		if (body.rating != null) {
			const r = Number(body.rating)
			if (!Number.isFinite(r) || r < 1 || r > 5) {
				return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 })
			}
			updateData.rating = r
		}

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
		}

		const { data, error } = await supabase
			.from('reviews')
			.update(updateData)
			.eq('id', id)
			.select('*')
			.single()

		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ review: data })
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createRequestClient(request)
		const userId = await getAuthenticatedUserId(request)
	const { id } = params

		// Ensure review belongs to user
		const { data: existing, error: fetchErr } = await supabase
			.from('reviews')
			.select('id, user_id')
			.eq('id', id)
			.single()
		if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		if ((existing as any).user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

		const { error } = await supabase.from('reviews').delete().eq('id', id)
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ ok: true })
	} catch (err) {
		if (err instanceof Error && err.message === 'UNAUTHORIZED') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}











