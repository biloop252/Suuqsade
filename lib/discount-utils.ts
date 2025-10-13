import { supabase } from './supabase';
import { Discount, Coupon } from '@/types/database';

export interface ProductDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  maximum_discount_amount?: number;
  is_global: boolean;
  vendor_id?: string;
}

export interface ProductWithDiscounts {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  brand_id?: string;
  vendor_id?: string;
  discounts: ProductDiscount[];
  final_price: number;
  discount_amount: number;
  has_discount: boolean;
}

/**
 * Fetch discounts for multiple products efficiently
 */
export async function getBatchProductDiscounts(products: Product[]): Promise<Record<string, ProductDiscount[]>> {
  try {
    const productDiscountMap: Record<string, ProductDiscount[]> = {};
    
    // Initialize empty arrays for all products
    products.forEach(product => {
      productDiscountMap[product.id] = [];
    });

    const currentTime = new Date().toISOString();

    // Fetch all active discounts at once
    const { data: allDiscounts, error: discountError } = await supabase
      .from('discounts')
      .select(`
        id, name, type, value, maximum_discount_amount, is_global, vendor_id,
        vendor_product_discounts(product_id, vendor_id),
        vendor_category_discounts(category_id, vendor_id),
        vendor_brand_discounts(brand_id, vendor_id)
      `)
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', currentTime)
      .or(`end_date.is.null,end_date.gte.${currentTime}`);

    if (discountError) {
      console.error('Error fetching batch discounts:', discountError);
      return productDiscountMap;
    }

    if (!allDiscounts) {
      return productDiscountMap;
    }

    // Process each product and find applicable discounts
    products.forEach(product => {
      const applicableDiscounts: ProductDiscount[] = [];

      allDiscounts.forEach(discount => {
        let isApplicable = false;

        // Check global discounts
        if (discount.is_global) {
          isApplicable = true;
        }
        // Check vendor-specific discounts
        else if (discount.vendor_id === product.vendor_id) {
          // Check product-specific discounts
          if (discount.vendor_product_discounts?.some((vpd: any) => 
            vpd.product_id === product.id && vpd.vendor_id === product.vendor_id
          )) {
            isApplicable = true;
          }
          // Check category-specific discounts
          else if (product.category_id && discount.vendor_category_discounts?.some((vcd: any) => 
            vcd.category_id === product.category_id && vcd.vendor_id === product.vendor_id
          )) {
            isApplicable = true;
          }
          // Check brand-specific discounts
          else if (product.brand_id && discount.vendor_brand_discounts?.some((vbd: any) => 
            vbd.brand_id === product.brand_id && vbd.vendor_id === product.vendor_id
          )) {
            isApplicable = true;
          }
        }

        if (isApplicable) {
          applicableDiscounts.push({
            id: discount.id,
            name: discount.name,
            type: discount.type,
            value: discount.value,
            maximum_discount_amount: discount.maximum_discount_amount,
            is_global: discount.is_global,
            vendor_id: discount.vendor_id
          });
        }
      });

      productDiscountMap[product.id] = applicableDiscounts;
    });

    return productDiscountMap;
  } catch (error) {
    console.error('Error in getBatchProductDiscounts:', error);
    return {};
  }
}

/**
 * Fetch applicable discounts for a product
 */
export async function getProductDiscounts(productId: string): Promise<ProductDiscount[]> {
  try {
    // Get product details first
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, category_id, brand_id, vendor_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return [];
    }

    const discounts: ProductDiscount[] = [];

    // 1. Check for global discounts
    const { data: globalDiscounts, error: globalError } = await supabase
      .from('discounts')
      .select('id, name, type, value, maximum_discount_amount, is_global, vendor_id')
      .eq('is_global', true)
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

    if (globalError) {
      console.error('Error fetching global discounts:', globalError);
    } else if (globalDiscounts) {
      discounts.push(...globalDiscounts);
    }

    // 2. Check for product-specific discounts (only if vendor matches)
    const { data: productDiscounts, error: productDiscountError } = await supabase
      .from('discounts')
      .select(`
        id, name, type, value, maximum_discount_amount, is_global, vendor_id,
        vendor_product_discounts!inner(product_id, vendor_id)
      `)
      .eq('vendor_product_discounts.product_id', productId)
      .eq('vendor_product_discounts.vendor_id', product.vendor_id)
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

    if (productDiscountError) {
      console.error('Error fetching product-specific discounts:', productDiscountError);
    } else if (productDiscounts) {
      discounts.push(...productDiscounts);
    }

    // 3. Check for category-specific discounts (only if vendor matches)
    if (product.category_id) {
      const { data: categoryDiscounts } = await supabase
        .from('discounts')
        .select(`
          id, name, type, value, maximum_discount_amount, is_global, vendor_id,
          vendor_category_discounts!inner(category_id, vendor_id)
        `)
        .eq('vendor_category_discounts.category_id', product.category_id)
        .eq('vendor_category_discounts.vendor_id', product.vendor_id)
        .eq('is_active', true)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (categoryDiscounts) {
        discounts.push(...categoryDiscounts);
      }
    }

    // 4. Check for brand-specific discounts (only if vendor matches)
    if (product.brand_id) {
      const { data: brandDiscounts } = await supabase
        .from('discounts')
        .select(`
          id, name, type, value, maximum_discount_amount, is_global, vendor_id,
          vendor_brand_discounts!inner(brand_id, vendor_id)
        `)
        .eq('vendor_brand_discounts.brand_id', product.brand_id)
        .eq('vendor_brand_discounts.vendor_id', product.vendor_id)
        .eq('is_active', true)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (brandDiscounts) {
        discounts.push(...brandDiscounts);
      }
    }

    // 5. Check for vendor-specific discounts
    if (product.vendor_id) {
      const { data: vendorDiscounts } = await supabase
        .from('discounts')
        .select('id, name, type, value, maximum_discount_amount, is_global, vendor_id')
        .eq('vendor_id', product.vendor_id)
        .eq('is_active', true)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (vendorDiscounts) {
        discounts.push(...vendorDiscounts);
      }
    }

    // Remove duplicates and return
    const uniqueDiscounts = discounts.filter((discount, index, self) => 
      index === self.findIndex(d => d.id === discount.id)
    );

    return uniqueDiscounts;
  } catch (error) {
    console.error('Error fetching product discounts:', error);
    return [];
  }
}

/**
 * Calculate the best discount for a product
 */
export function calculateBestDiscount(
  product: { price: number },
  discounts: ProductDiscount[]
): { final_price: number; discount_amount: number; best_discount?: ProductDiscount } {
  const originalPrice = product.price;
  let bestDiscount: ProductDiscount | undefined;
  let maxDiscountAmount = 0;

  for (const discount of discounts) {
    let discountAmount = 0;

    switch (discount.type) {
      case 'percentage':
        discountAmount = (originalPrice * discount.value) / 100;
        if (discount.maximum_discount_amount) {
          discountAmount = Math.min(discountAmount, discount.maximum_discount_amount);
        }
        break;
      case 'fixed_amount':
        discountAmount = Math.min(discount.value, originalPrice);
        break;
      case 'free_shipping':
        // Free shipping doesn't affect product price
        discountAmount = 0;
        break;
    }

    if (discountAmount > maxDiscountAmount) {
      maxDiscountAmount = discountAmount;
      bestDiscount = discount;
    }
  }

  const finalPrice = Math.max(0, originalPrice - maxDiscountAmount);

  return {
    final_price: finalPrice,
    discount_amount: maxDiscountAmount,
    best_discount: bestDiscount
  };
}

/**
 * Apply discounts to a list of products
 */
export async function applyDiscountsToProducts<T extends { id: string; price: number }>(
  products: T[]
): Promise<(T & { discounts: ProductDiscount[]; final_price: number; discount_amount: number; has_discount: boolean })[]> {
  const productsWithDiscounts = await Promise.all(
    products.map(async (product) => {
      const discounts = await getProductDiscounts(product.id);
      const { final_price, discount_amount, best_discount } = calculateBestDiscount(product, discounts);

      return {
        ...product,
        discounts,
        final_price,
        discount_amount,
        has_discount: discount_amount > 0
      };
    })
  );

  return productsWithDiscounts;
}
