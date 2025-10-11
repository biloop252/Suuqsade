import { Coupon, Discount, DiscountType } from '@/types/database';

export interface DiscountCalculation {
  discountAmount: number;
  finalAmount: number;
  discountType: DiscountType;
  appliedCoupon?: Coupon;
  appliedDiscount?: Discount;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  total: number;
  vendor_id?: string; // Vendor who owns this product
}

export class DiscountCalculator {
  /**
   * Calculate discount amount for a coupon
   */
  static calculateCouponDiscount(
    coupon: Coupon, 
    orderAmount: number, 
    cartItems: CartItem[] = []
  ): number {
    // Check minimum order amount
    if (coupon.minimum_order_amount > 0 && orderAmount < coupon.minimum_order_amount) {
      return 0;
    }

    switch (coupon.type) {
      case 'percentage':
        const percentageDiscount = (orderAmount * coupon.value) / 100;
        return coupon.maximum_discount_amount 
          ? Math.min(percentageDiscount, coupon.maximum_discount_amount)
          : percentageDiscount;
      
      case 'fixed_amount':
        return Math.min(coupon.value, orderAmount);
      
      case 'free_shipping':
        return 0; // This is handled separately for shipping costs
      
      default:
        return 0;
    }
  }

  /**
   * Calculate discount amount for an automatic discount
   */
  static calculateDiscountAmount(
    discount: Discount, 
    orderAmount: number, 
    cartItems: CartItem[] = []
  ): number {
    // Check minimum order amount
    if (discount.minimum_order_amount > 0 && orderAmount < discount.minimum_order_amount) {
      return 0;
    }

    switch (discount.type) {
      case 'percentage':
        const percentageDiscount = (orderAmount * discount.value) / 100;
        return discount.maximum_discount_amount 
          ? Math.min(percentageDiscount, discount.maximum_discount_amount)
          : percentageDiscount;
      
      case 'fixed_amount':
        return Math.min(discount.value, orderAmount);
      
      case 'free_shipping':
        return 0; // This is handled separately for shipping costs
      
      default:
        return 0;
    }
  }

  /**
   * Calculate the best discount for an order
   */
  static calculateBestDiscount(
    orderAmount: number,
    cartItems: CartItem[] = [],
    availableDiscounts: Discount[] = [],
    appliedCoupon?: Coupon
  ): DiscountCalculation {
    let bestDiscount = 0;
    let bestDiscountType: DiscountType = 'percentage';
    let appliedCouponResult: Coupon | undefined = appliedCoupon;
    let appliedDiscountResult: Discount | undefined;

    // Calculate coupon discount if applied
    if (appliedCoupon) {
      const couponDiscount = this.calculateCouponDiscount(appliedCoupon, orderAmount, cartItems);
      if (couponDiscount > bestDiscount) {
        bestDiscount = couponDiscount;
        bestDiscountType = appliedCoupon.type;
        appliedCouponResult = appliedCoupon;
        appliedDiscountResult = undefined;
      }
    }

    // Calculate automatic discounts
    for (const discount of availableDiscounts) {
      const discountAmount = this.calculateDiscountAmount(discount, orderAmount, cartItems);
      if (discountAmount > bestDiscount) {
        bestDiscount = discountAmount;
        bestDiscountType = discount.type;
        appliedCouponResult = undefined;
        appliedDiscountResult = discount;
      }
    }

    return {
      discountAmount: bestDiscount,
      finalAmount: Math.max(0, orderAmount - bestDiscount),
      discountType: bestDiscountType,
      appliedCoupon: appliedCouponResult,
      appliedDiscount: appliedDiscountResult
    };
  }

  /**
   * Format discount value for display
   */
  static formatDiscountValue(value: number, type: DiscountType): string {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'fixed_amount':
        return `$${value}`;
      case 'free_shipping':
        return 'Free Shipping';
      default:
        return `${value}%`;
    }
  }

  /**
   * Check if a coupon is valid for the current order
   */
  static isCouponValidForOrder(
    coupon: Coupon, 
    orderAmount: number, 
    cartItems: CartItem[] = []
  ): { valid: boolean; reason?: string } {
    // Check minimum order amount
    if (coupon.minimum_order_amount > 0 && orderAmount < coupon.minimum_order_amount) {
      return {
        valid: false,
        reason: `Minimum order amount of $${coupon.minimum_order_amount} required`
      };
    }

    // Check if coupon is active
    if (!coupon.is_active || coupon.status !== 'active') {
      return {
        valid: false,
        reason: 'Coupon is not active'
      };
    }

    // Check date validity
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = coupon.end_date ? new Date(coupon.end_date) : null;

    if (now < startDate) {
      return {
        valid: false,
        reason: 'Coupon is not yet active'
      };
    }

    if (endDate && now > endDate) {
      return {
        valid: false,
        reason: 'Coupon has expired'
      };
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return {
        valid: false,
        reason: 'Coupon usage limit reached'
      };
    }

    return { valid: true };
  }

  /**
   * Check if a discount is valid for the current order
   */
  static isDiscountValidForOrder(
    discount: Discount, 
    orderAmount: number, 
    cartItems: CartItem[] = []
  ): { valid: boolean; reason?: string } {
    // Check minimum order amount
    if (discount.minimum_order_amount > 0 && orderAmount < discount.minimum_order_amount) {
      return {
        valid: false,
        reason: `Minimum order amount of $${discount.minimum_order_amount} required`
      };
    }

    // Check if discount is active
    if (!discount.is_active || discount.status !== 'active') {
      return {
        valid: false,
        reason: 'Discount is not active'
      };
    }

    // Check date validity
    const now = new Date();
    const startDate = new Date(discount.start_date);
    const endDate = discount.end_date ? new Date(discount.end_date) : null;

    if (now < startDate) {
      return {
        valid: false,
        reason: 'Discount is not yet active'
      };
    }

    if (endDate && now > endDate) {
      return {
        valid: false,
        reason: 'Discount has expired'
      };
    }

    // Check usage limits
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return {
        valid: false,
        reason: 'Discount usage limit reached'
      };
    }

    return { valid: true };
  }

  /**
   * Calculate vendor-specific discount for products/categories
   */
  static calculateVendorDiscount(
    discount: Discount,
    cartItems: CartItem[],
    vendorId: string,
    applicableProductIds: string[] = [],
    applicableCategoryIds: string[] = []
  ): number {
    // Filter cart items that belong to the vendor
    const vendorItems = cartItems.filter(item => item.vendor_id === vendorId);
    
    if (vendorItems.length === 0) {
      return 0;
    }

    // Calculate total for applicable items
    let applicableTotal = 0;
    
    if (discount.is_global) {
      // Global discount applies to all vendor items
      applicableTotal = vendorItems.reduce((sum, item) => sum + item.total, 0);
    } else {
      // Specific discount applies only to selected products/categories
      const applicableItems = vendorItems.filter(item => 
        applicableProductIds.includes(item.product_id) ||
        // You would need to check category associations here
        false // Placeholder for category checking
      );
      applicableTotal = applicableItems.reduce((sum, item) => sum + item.total, 0);
    }

    if (applicableTotal === 0) {
      return 0;
    }

    // Check minimum order amount
    if (discount.minimum_order_amount > 0 && applicableTotal < discount.minimum_order_amount) {
      return 0;
    }

    // Calculate discount amount
    switch (discount.type) {
      case 'percentage':
        const percentageDiscount = (applicableTotal * discount.value) / 100;
        return discount.maximum_discount_amount 
          ? Math.min(percentageDiscount, discount.maximum_discount_amount)
          : percentageDiscount;
      
      case 'fixed_amount':
        return Math.min(discount.value, applicableTotal);
      
      case 'free_shipping':
        return 0; // This would be handled separately for shipping costs
      
      default:
        return 0;
    }
  }

  /**
   * Check if vendor discount is valid for specific products/categories
   */
  static isVendorDiscountValidForOrder(
    discount: Discount,
    vendorId: string,
    orderAmount: number,
    cartItems: CartItem[] = [],
    applicableProductIds: string[] = [],
    applicableCategoryIds: string[] = []
  ): { valid: boolean; reason?: string } {
    // Check if discount belongs to vendor or is global
    if (discount.vendor_id && discount.vendor_id !== vendorId) {
      return {
        valid: false,
        reason: 'Discount does not belong to this vendor'
      };
    }

    // Check minimum order amount
    if (discount.minimum_order_amount > 0 && orderAmount < discount.minimum_order_amount) {
      return {
        valid: false,
        reason: `Minimum order amount of $${discount.minimum_order_amount} required`
      };
    }

    // Check if discount is active
    if (!discount.is_active || discount.status !== 'active') {
      return {
        valid: false,
        reason: 'Discount is not active'
      };
    }

    // Check date validity
    const now = new Date();
    const startDate = new Date(discount.start_date);
    const endDate = discount.end_date ? new Date(discount.end_date) : null;

    if (now < startDate) {
      return {
        valid: false,
        reason: 'Discount is not yet active'
      };
    }

    if (endDate && now > endDate) {
      return {
        valid: false,
        reason: 'Discount has expired'
      };
    }

    // Check usage limits
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return {
        valid: false,
        reason: 'Discount usage limit reached'
      };
    }

    // Check if discount applies to any cart items
    const vendorItems = cartItems.filter(item => item.vendor_id === vendorId);
    if (vendorItems.length === 0) {
      return {
        valid: false,
        reason: 'No items from this vendor in cart'
      };
    }

    if (!discount.is_global) {
      const hasApplicableItems = vendorItems.some(item => 
        applicableProductIds.includes(item.product_id)
      );
      
      if (!hasApplicableItems) {
        return {
          valid: false,
          reason: 'Discount does not apply to any items in cart'
        };
      }
    }

    return { valid: true };
  }
}
