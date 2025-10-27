import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const byParent: Record<string, any[]> = {}
    for (const cat of data || []) {
      const parent = (cat as any).parent_id || 'root'
      if (!byParent[parent]) byParent[parent] = []
      byParent[parent].push(cat)
    }

    const build = (parentId: string | null): any[] => {
      const key = parentId || 'root'
      const children = byParent[key] || []
      return children.map((c: any) => ({
        ...c,
        children: build(c.id)
      }))
    }

    return NextResponse.json({ tree: build(null) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


