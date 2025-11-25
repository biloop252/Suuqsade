import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('city_id') || ''

    if (!cityId) {
      return NextResponse.json({ error: 'Missing required param: city_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('locations')
      .select('id, name')
      .eq('parent_id', cityId)
      .eq('level', 3)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load districts' }, { status: 500 })
    }

    return NextResponse.json({ districts: data || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}




















