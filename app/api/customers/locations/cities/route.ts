import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('country_id') || ''
    const levelParam = searchParams.get('level')
    const targetLevel = Number.isInteger(levelParam as any) ? Number(levelParam) : 1 // default level=1 per request

    if (!countryId) {
      return NextResponse.json({ error: 'Missing required param: country_id' }, { status: 400 })
    }

    // First try with requested level (default 1)
    const { data: primary, error: primaryError } = await supabase
      .from('locations')
      .select('id, name, level')
      .eq('parent_id', countryId)
      .eq('level', targetLevel)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (primaryError) {
      return NextResponse.json({ error: 'Failed to load cities' }, { status: 500 })
    }

    // If none found and caller used default level=1, gracefully fallback to level=2
    if ((primary?.length || 0) === 0 && targetLevel === 1) {
      const { data: fallback, error: fallbackError } = await supabase
        .from('locations')
        .select('id, name, level')
        .eq('parent_id', countryId)
        .eq('level', 2)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to load cities' }, { status: 500 })
      }

      return NextResponse.json({ cities: fallback || [], level_used: 2 })
    }

    return NextResponse.json({ cities: primary || [], level_used: targetLevel })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}





