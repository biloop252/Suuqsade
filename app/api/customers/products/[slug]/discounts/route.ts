import { NextRequest, NextResponse } from 'next/server'
import { createRequestClient } from '@/lib/supabase-server'

type ProductRow = {
	id: string
	price: number
	category_id?: string | null
	brand_id?: string | null
	vendor_id?: string | null
}

type SimpleDiscount = {
	id: string
	name: string
	type: 'percentage' | 'fixed_amount' | 'free_shipping'
	value: number
	maximum_discount_amount?: number | null
	is_global: boolean
	vendor_id?: string | null
}

function calculateBestDiscount(price: number, discounts: SimpleDiscount[]) {
	let bestAmount = 0
	let best: SimpleDiscount | undefined
	for (const d of discounts) {
		let amt = 0
		switch (d.type) {
			case 'percentage':
				amt = (price * d.value) / 100
				if (d.maximum_discount_amount) amt = Math.min(amt, d.maximum_discount_amount)
				break
			case 'fixed_amount':
				amt = Math.min(d.value, price)
				break
			case 'free_shipping':
				amt = 0
		}
		if (amt > bestAmount) { bestAmount = amt; best = d }
	}
	return { final_price: Math.max(0, price - bestAmount), discount_amount: bestAmount, best_discount: best }
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
	try {
		const supabase = createRequestClient(request)
		const { slug } = params

		// Resolve minimal product fields
		const { data: product, error: prodErr } = await supabase
			.from('products')
			.select('id, price, category_id, brand_id, vendor_id')
			.eq('slug', slug)
			.eq('is_active', true)
			.single<ProductRow>()

		if (prodErr || !product) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		const now = new Date().toISOString()
		const uniqById = new Map<string, SimpleDiscount>()

		// Global discounts
		const { data: global } = await supabase
			.from('discounts')
			.select('id, name, type, value, maximum_discount_amount, is_global, vendor_id')
			.eq('is_global', true)
			.eq('is_active', true)
			.eq('status', 'active')
			.lte('start_date', now)
			.or(`end_date.is.null,end_date.gte.${now}`)
		;(global || []).forEach(d => uniqById.set(d.id, d as unknown as SimpleDiscount))

		// Product-specific
		const { data: prodDiscounts } = await supabase
			.from('discounts')
			.select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, vendor_product_discounts!inner(product_id, vendor_id)')
			.eq('vendor_product_discounts.product_id', product.id)
			.eq('vendor_product_discounts.vendor_id', product.vendor_id)
			.eq('is_active', true)
			.eq('status', 'active')
			.lte('start_date', now)
			.or(`end_date.is.null,end_date.gte.${now}`)
		;(prodDiscounts || []).forEach(d => uniqById.set(d.id, d as unknown as SimpleDiscount))

		// Category-specific
		if (product.category_id) {
			const { data: catDiscounts } = await supabase
				.from('discounts')
				.select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, vendor_category_discounts!inner(category_id, vendor_id)')
				.eq('vendor_category_discounts.category_id', product.category_id)
				.eq('vendor_category_discounts.vendor_id', product.vendor_id)
				.eq('is_active', true)
				.eq('status', 'active')
				.lte('start_date', now)
				.or(`end_date.is.null,end_date.gte.${now}`)
			;(catDiscounts || []).forEach(d => uniqById.set(d.id, d as unknown as SimpleDiscount))
		}

		// Brand-specific
		if (product.brand_id) {
			const { data: brandDiscounts } = await supabase
				.from('discounts')
				.select('id, name, type, value, maximum_discount_amount, is_global, vendor_id, vendor_brand_discounts!inner(brand_id, vendor_id)')
				.eq('vendor_brand_discounts.brand_id', product.brand_id)
				.eq('vendor_brand_discounts.vendor_id', product.vendor_id)
				.eq('is_active', true)
				.eq('status', 'active')
				.lte('start_date', now)
				.or(`end_date.is.null,end_date.gte.${now}`)
			;(brandDiscounts || []).forEach(d => uniqById.set(d.id, d as unknown as SimpleDiscount))
		}

		// Vendor-wide
		if (product.vendor_id) {
			const { data: vendorDiscounts } = await supabase
				.from('discounts')
				.select('id, name, type, value, maximum_discount_amount, is_global, vendor_id')
				.eq('vendor_id', product.vendor_id)
				.eq('is_active', true)
				.eq('status', 'active')
				.lte('start_date', now)
				.or(`end_date.is.null,end_date.gte.${now}`)
			;(vendorDiscounts || []).forEach(d => uniqById.set(d.id, d as unknown as SimpleDiscount))
		}

		const discounts = Array.from(uniqById.values())
		const best = calculateBestDiscount(product.price, discounts)

		return NextResponse.json({
			product_id: product.id,
			price: product.price,
			discounts,
			discountInfo: { final_price: best.final_price, discount_amount: best.discount_amount, has_discount: best.discount_amount > 0, best_discount: best.best_discount }
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}



