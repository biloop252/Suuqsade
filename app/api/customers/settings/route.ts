import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	try {
		const supabase = createRequestClient(request)

		const { searchParams } = new URL(request.url)
		const category = searchParams.get('category')
		const key = searchParams.get('key')

		let query = supabase
			.from('system_settings')
			.select('*')
			.eq('is_public', true)
			.order('category', { ascending: true })
			.order('setting_key', { ascending: true })

		// Filter by category if provided
		if (category) {
			query = query.eq('category', category)
		}

		// Filter by key if provided
		if (key) {
			query = query.eq('setting_key', key)
		}

		const { data, error } = await query

		if (error) {
			console.error('Error fetching public settings:', error)
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		// If single key requested, return single setting object, otherwise return array
		if (key && data && data.length > 0) {
			return NextResponse.json({ setting: data[0] })
		}

		return NextResponse.json({ settings: data ?? [] })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('Error in GET /api/customers/settings:', message)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}








