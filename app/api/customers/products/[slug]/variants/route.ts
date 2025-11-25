import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createRequestClient(request)
    const { slug } = params

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (productError) {
      if ((productError as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, name, sku, price, stock_quantity, attributes')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .order('created_at')

    if (variantsError) {
      return NextResponse.json({ error: variantsError.message }, { status: 500 })
    }

    const variantIds = (variants ?? []).map(v => v.id)
    if (!variantIds.length) {
      return NextResponse.json({ items: [] })
    }

    const { data: variantAttrs, error: attrsError } = await supabase
      .from('product_variant_attributes')
      .select(`
        variant_id,
        value,
        display_value,
        attribute:product_attributes(id, name, slug, sort_order)
      `)
      .in('variant_id', variantIds)

    if (attrsError) {
      return NextResponse.json({ error: attrsError.message }, { status: 500 })
    }

    let rows = (variantAttrs ?? []) as unknown as VariantAttrRow[]

    // Fallback: derive from product_variants.attributes JSON if no rows were found
    if (!rows.length) {
      // Collect all attribute keys from JSON across variants
      const attributeKeys = new Set<string>()
      for (const v of variants ?? []) {
        const obj = (v as any).attributes as Record<string, any> | null
        if (!obj || typeof obj !== 'object') continue
        for (const k of Object.keys(obj)) attributeKeys.add(k)
      }

      if (attributeKeys.size > 0) {
        // Partition keys into UUID-like (likely attribute_id) and slugs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const idKeys: string[] = []
        const slugKeys: string[] = []
        Array.from(attributeKeys).forEach(k => {
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
        for (const v of variants ?? []) {
          const obj = (v as any).attributes as Record<string, any> | null
          if (!obj || typeof obj !== 'object') continue
          for (const [key, rawVal] of Object.entries(obj)) {
            const meta = (metaById.get(key) || metaBySlug.get(key)) || null
            if (!meta) continue
            const pushValue = (val: any) => {
              if (val === undefined || val === null) return
              derivedRows.push({
                variant_id: (v as any).id,
                value: String(val),
                display_value: String(val),
                attribute: { id: meta.id, name: meta.name, slug: meta.slug, sort_order: meta.sort_order }
              })
            }
            if (Array.isArray(rawVal)) rawVal.forEach(pushValue)
            else pushValue(rawVal)
          }
        }

        rows = derivedRows
      }
    }

    const attrsByVariant = new Map<string, any[]>()
    for (const row of rows) {
      const list = attrsByVariant.get(row.variant_id) || []
      list.push(row)
      attrsByVariant.set(row.variant_id, list)
    }

    // Build a product-level list of variant-defining attributes and their available values
    type VariantAttrRow = {
      variant_id: string,
      value: string,
      display_value: string | null,
      attribute: { id: string, name: string, slug: string, sort_order: number | null } | null
    }

    const productAttributeMap = new Map<string, {
      attribute_id: string,
      attribute_slug: string,
      attribute_name: string,
      sort_order: number,
      values: { value: string, display_value: string }[]
    }>()

    for (const row of rows) {
      if (!row.attribute) continue
      const key = row.attribute.id
      if (!productAttributeMap.has(key)) {
        productAttributeMap.set(key, {
          attribute_id: row.attribute.id,
          attribute_slug: row.attribute.slug,
          attribute_name: row.attribute.name,
          sort_order: row.attribute.sort_order ?? 0,
          values: []
        })
      }
      const entry = productAttributeMap.get(key)!
      const exists = entry.values.some(v => v.value === row.value)
      if (!exists) {
        entry.values.push({ value: row.value, display_value: row.display_value ?? row.value })
      }
    }

    // Sort attribute values and attributes by sort_order then name
    const attributes = Array.from(productAttributeMap.values())
      .sort((a, b) => (a.sort_order - b.sort_order) || a.attribute_name.localeCompare(b.attribute_name))
      .map(a => ({
        attribute_id: a.attribute_id,
        attribute_slug: a.attribute_slug,
        attribute_name: a.attribute_name,
        sort_order: a.sort_order,
        values: a.values.sort((x, y) => x.display_value.localeCompare(y.display_value))
      }))

    const items = (variants ?? []).map(v => {
      const attrs = (attrsByVariant.get(v.id) || [])
        .filter(a => a.attribute)
        .sort((a, b) => {
          const sa = (a.attribute?.sort_order ?? 0)
          const sb = (b.attribute?.sort_order ?? 0)
          return sa - sb
        })
        .map(a => ({
          attribute_id: a.attribute.id,
          attribute_slug: a.attribute.slug,
          attribute_name: a.attribute.name,
          value: a.value,
          display_value: a.display_value ?? a.value
        }))

      const combined_attributes = attrs
        .map(a => `${a.attribute_name}: ${a.display_value ?? a.value}`)
        .join(' / ')

      const priceNum = v.price !== null && v.price !== undefined ? Number(v.price) : null

      return {
        id: v.id,
        name: v.name,
        sku: v.sku,
        stock_quantity: v.stock_quantity,
        price: priceNum,
        in_stock: (v.stock_quantity ?? 0) > 0,
        attributes: attrs,
        combined_attributes
      }
    })

    // Build a combinations index for quick client-side lookup: "color:Blue|size:M" => variant info
    const attributeOrder = attributes.map(a => a.attribute_slug)
    const buildKey = (pairs: { attribute_slug: string, value: string }[]) => {
      const bySlug: Record<string, string> = {}
      for (const p of pairs) bySlug[p.attribute_slug] = String(p.value)
      return attributeOrder
        .filter(slug => bySlug[slug] !== undefined)
        .map(slug => `${slug}:${bySlug[slug]}`)
        .join('|')
    }

    const combinations: Record<string, { id: string, price: number | null, stock_quantity: number, in_stock: boolean } > = {}
    for (const it of items) {
      if (!it.attributes || it.attributes.length === 0) continue
      const key = buildKey(it.attributes.map(a => ({ attribute_slug: a.attribute_slug, value: a.value })))
      combinations[key] = {
        id: it.id,
        price: it.price,
        stock_quantity: it.stock_quantity ?? 0,
        in_stock: (it.stock_quantity ?? 0) > 0
      }
    }

    // Choose a reasonable default variant (first in-stock, else first)
    const defaultVariantId = (items.find(i => i.in_stock)?.id) || (items[0]?.id) || null

    return NextResponse.json({
      items,
      attributes,
      attribute_order: attributeOrder,
      combinations,
      default_variant_id: defaultVariantId
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


