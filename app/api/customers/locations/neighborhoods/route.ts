import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const { searchParams } = new URL(request.url)
    const districtId = searchParams.get('district_id') || ''

    if (!districtId) {
      return NextResponse.json({ error: 'Missing required param: district_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('locations')
      .select('id, name')
      .eq('parent_id', districtId)
      .eq('level', 4)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load neighborhoods' }, { status: 500 })
    }

    return NextResponse.json({ neighborhoods: data || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}




















