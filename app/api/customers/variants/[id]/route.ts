import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { id } = params

    // Fetch the variant
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (variantError) {
      if ((variantError as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
      }
      return NextResponse.json({ error: variantError.message }, { status: 500 })
    }

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Fetch variant attributes
    const { data: variantAttrs, error: attrsError } = await supabase
      .from('product_variant_attributes')
      .select(`
        variant_id,
        value,
        display_value,
        attribute:product_attributes(id, name, slug, sort_order)
      `)
      .eq('variant_id', id)

    if (attrsError) {
      return NextResponse.json({ error: attrsError.message }, { status: 500 })
    }

    // Process attributes similar to the variants list endpoint
    type VariantAttrRow = {
      variant_id: string,
      value: string,
      display_value: string | null,
      attribute: { id: string, name: string, slug: string, sort_order: number | null } | null
    }

    let rows = (variantAttrs ?? []) as unknown as VariantAttrRow[]

    // Fallback: derive from product_variants.attributes JSON if no rows were found
    if (!rows.length && variant.attributes) {
      const obj = variant.attributes as Record<string, any> | null
      if (obj && typeof obj === 'object') {
        const attributeKeys = Object.keys(obj)
        
        if (attributeKeys.length > 0) {
          // Partition keys into UUID-like (likely attribute_id) and slugs
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          const idKeys: string[] = []
          const slugKeys: string[] = []
          attributeKeys.forEach(k => {
            if (uuidRegex.test(k)) idKeys.push(k)
            else slugKeys.push(k)
          })

          // Fetch attribute metadata for mapping
          const [byIdRes, bySlugRes] = await Promise.all([
            idKeys.length
              ? supabase.from('product_attributes').select('id, name, slug, sort_order').in('id', idKeys)
              : Promise.resolve({ data: [] as any[], error: null } as any),
            slugKeys.length
              ? supabase.from('product_attributes').select('id, name, slug, sort_order').in('slug', slugKeys)
              : Promise.resolve({ data: [] as any[], error: null } as any)
          ])

          if (byIdRes.error || bySlugRes.error) {
            return NextResponse.json({ error: (byIdRes.error || bySlugRes.error)?.message || 'Failed to load attributes' }, { status: 500 })
          }

          const metas: { id: string, name: string, slug: string, sort_order: number | null }[] = [
            ...(byIdRes.data || []),
            ...(bySlugRes.data || [])
          ]
          const metaById = new Map(metas.map(m => [m.id, m]))
          const metaBySlug = new Map(metas.map(m => [m.slug, m]))

          const derivedRows: VariantAttrRow[] = []
          for (const [key, rawVal] of Object.entries(obj)) {
            const meta = (metaById.get(key) || metaBySlug.get(key)) || null
            if (!meta) continue
            const pushValue = (val: any) => {
              if (val === undefined || val === null) return
              derivedRows.push({
                variant_id: variant.id,
                value: String(val),
                display_value: String(val),
                attribute: { id: meta.id, name: meta.name, slug: meta.slug, sort_order: meta.sort_order }
              })
            }
            if (Array.isArray(rawVal)) rawVal.forEach(pushValue)
            else pushValue(rawVal)
          }

          rows = derivedRows
        }
      }
    }

    // Format attributes
    const attrs = rows
      .filter(a => a.attribute)
      .sort((a, b) => {
        const sa = (a.attribute?.sort_order ?? 0)
        const sb = (b.attribute?.sort_order ?? 0)
        return sa - sb
      })
      .map(a => ({
        attribute_id: a.attribute!.id,
        attribute_slug: a.attribute!.slug,
        attribute_name: a.attribute!.name,
        value: a.value,
        display_value: a.display_value ?? a.value
      }))

    const combined_attributes = attrs
      .map(a => `${a.attribute_name}: ${a.display_value ?? a.value}`)
      .join(' / ')

    const priceNum = variant.price !== null && variant.price !== undefined ? Number(variant.price) : null

    // Return formatted variant data
    return NextResponse.json({
      id: variant.id,
      product_id: variant.product_id,
      name: variant.name,
      sku: variant.sku,
      stock_quantity: variant.stock_quantity,
      price: priceNum,
      sale_price: variant.sale_price ? Number(variant.sale_price) : null,
      in_stock: (variant.stock_quantity ?? 0) > 0,
      attributes: attrs,
      combined_attributes,
      is_active: variant.is_active,
      created_at: variant.created_at,
      updated_at: variant.updated_at
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}









