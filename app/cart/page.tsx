'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useNotification } from '@/lib/notification-context';
import { ProductWithDetails } from '@/types/database';
import { getBatchProductDiscounts, calculateBestDiscount, ProductDiscount } from '@/lib/discount-utils';
import { DiscountCalculator } from '@/lib/discount-calculator';
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon, 
  TrashIcon,
  ArrowLeftIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product: ProductWithDetails;
}

export default function CartPage() {
  const { user } = useAuth();
  const { 
    cartItems: contextCartItems, 
    updateQuantity: contextUpdateQuantity, 
    removeFromCart: contextRemoveFromCart,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon
  } = useCart();
  const { showSuccess, showError, showConfirm } = useNotification();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Discount states
  const [productDiscounts, setProductDiscounts] = useState<Record<string, ProductDiscount[]>>({});
  const [productDiscountAmounts, setProductDiscountAmounts] = useState<Record<string, number>>({});
  const [totalProductDiscounts, setTotalProductDiscounts] = useState(0);
  const [availableAutomaticDiscounts, setAvailableAutomaticDiscounts] = useState<any[]>([]);
  const [appliedAutomaticDiscount, setAppliedAutomaticDiscount] = useState<any>(null);
  const [automaticDiscountAmount, setAutomaticDiscountAmount] = useState(0);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      router.push('/auth/signin');
    }
  }, [user]);

  // Fetch discounts when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      fetchProductDiscounts();
      fetchAutomaticDiscounts();
    }
  }, [cartItems]);

  const fetchCartItems = async () => {
    try {
      // Only set loading if we don't have cart items yet
      if (cartItems.length === 0) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*),
            variants:product_variants(*)
          )
        `)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching cart items:', error);
      } else {
        setCartItems(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDiscounts = async () => {
    try {
      const products = cartItems.map(item => item.product).filter(Boolean) as ProductWithDetails[];
      
      if (products.length === 0) return;
      
      // Get batch discounts for all products
      const discountMap = await getBatchProductDiscounts(products);
      setProductDiscounts(discountMap);
      
      // Calculate discount amounts for each product
      const discountAmounts: Record<string, number> = {};
      let totalDiscounts = 0;
      
      cartItems.forEach(item => {
        if (item.product) {
          const itemDiscounts = discountMap[item.product.id] || [];
          const { discount_amount } = calculateBestDiscount(item.product, itemDiscounts);
          const totalDiscountForItem = discount_amount * item.quantity;
          discountAmounts[item.product.id] = totalDiscountForItem;
          totalDiscounts += totalDiscountForItem;
        }
      });
      
      setProductDiscountAmounts(discountAmounts);
      setTotalProductDiscounts(totalDiscounts);
    } catch (error) {
      console.error('Error fetching product discounts:', error);
    }
  };

  const fetchAutomaticDiscounts = async () => {
    try {
      const subtotal = calculateSubtotalWithProductDiscounts();
      
      // Fetch available automatic discounts
      const { data: discounts, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .eq('is_global', true) // Only global discounts for automatic application
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .lte('minimum_order_amount', subtotal)
        .order('value', { ascending: false }); // Best discount first

      if (error) {
        console.error('Error fetching automatic discounts:', error);
        return;
      }

      if (discounts && discounts.length > 0) {
        setAvailableAutomaticDiscounts(discounts);
        
        // Apply the best automatic discount
        const bestDiscount = discounts[0];
        const discountAmount = DiscountCalculator.calculateDiscountAmount(bestDiscount, subtotal);
        
        if (discountAmount > 0) {
          setAppliedAutomaticDiscount(bestDiscount);
          setAutomaticDiscountAmount(discountAmount);
        }
      }
    } catch (error) {
      console.error('Error fetching automatic discounts:', error);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    // Prevent quantity from going below 1
    if (newQuantity < 1) {
      return;
    }
    
    try {
      setUpdating(itemId);
      
      // Find the item to get its name
      const item = cartItems.find(item => item.id === itemId);
      const itemName = item?.product?.name || 'Item';
      
      await contextUpdateQuantity(itemId, newQuantity);
      
      // Show success notification
      showSuccess(
        'Quantity Updated',
        `${itemName} quantity updated to ${newQuantity}`
      );
      
      // Refresh cart items after update
      await fetchCartItems();
    } catch (error) {
      console.error('Error:', error);
      showError(
        'Failed to Update Cart',
        'There was an error updating your cart. Please try again.'
      );
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    // Find the item to get its name for the notification
    const itemToRemove = cartItems.find(item => item.id === itemId);
    const itemName = itemToRemove?.product?.name || 'Item';
    
    // Show confirmation toast instead of browser confirm dialog
    showConfirm(
      'Remove Item',
      `Are you sure you want to remove "${itemName}" from your cart?`,
      async () => {
        // User confirmed removal
        try {
          setUpdating(itemId);
          await contextRemoveFromCart(itemId);
          
          // Show success notification
          showSuccess(
            'Removed from Cart',
            `${itemName} has been removed from your cart`
          );
          
          // Refresh cart items after removal
          await fetchCartItems();
        } catch (error) {
          console.error('Error:', error);
          showError(
            'Failed to Remove Item',
            'There was an error removing this item from your cart. Please try again.'
          );
        } finally {
          setUpdating(null);
        }
      }
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      if (item.product) {
        let price = item.product.price;
        
        // If item has a variant, use variant price instead of product price
        if (item.variant_id && item.product.variants) {
          const variant = item.product.variants.find((v: any) => v.id === item.variant_id);
          if (variant && variant.price) {
            price = variant.price;
          }
        }
        
        return total + (price * item.quantity);
      }
      return total;
    }, 0);
  };

  const calculateSubtotalWithProductDiscounts = () => {
    return cartItems.reduce((total, item) => {
      if (item.product) {
        let originalPrice = item.product.price;
        
        // If item has a variant, use variant price instead of product price
        if (item.variant_id && item.product.variants) {
          const variant = item.product.variants.find((v: any) => v.id === item.variant_id);
          if (variant && variant.price) {
            originalPrice = variant.price;
          }
        }
        
        const itemDiscounts = productDiscounts[item.product.id] || [];
        const { final_price } = calculateBestDiscount({ price: originalPrice }, itemDiscounts);
        return total + (final_price * item.quantity);
      }
      return total;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotalWithProductDiscounts();
    return subtotal * 0.08; // 8% tax on discounted amount
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotalWithProductDiscounts();
    const tax = calculateTax();
    const autoDiscount = automaticDiscountAmount;
    const couponDiscount = discountAmount; // This comes from cart context
    
    console.log('Cart Total Calculation:', {
      subtotal,
      tax,
      autoDiscount,
      couponDiscount,
      appliedCoupon: appliedCoupon?.name,
      finalTotal: subtotal + tax - autoDiscount - couponDiscount
    });
    
    return subtotal + tax - autoDiscount - couponDiscount;
  };

  // Coupon handling functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .eq('status', 'active')
        .single();

      if (error || !coupon) {
        setCouponError('Invalid coupon code');
        return;
      }

      // Check if coupon is expired
      const now = new Date();
      const startDate = new Date(coupon.start_date);
      const endDate = coupon.end_date ? new Date(coupon.end_date) : null;

      if (now < startDate || (endDate && now > endDate)) {
        setCouponError('Coupon has expired');
        return;
      }

      // Check minimum order amount
      const subtotal = calculateSubtotalWithProductDiscounts();
      if (coupon.minimum_order_amount > 0 && subtotal < coupon.minimum_order_amount) {
        setCouponError(`Minimum order amount of $${coupon.minimum_order_amount} required`);
        return;
      }

      // Apply the coupon using cart context
      await applyCoupon(coupon);
      console.log('Coupon applied successfully:', {
        couponName: coupon.name,
        couponCode: coupon.code,
        discountAmount: discountAmount,
        appliedCoupon: appliedCoupon
      });
      setCouponCode('');
      setCouponError('');
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-600">Products</Link>
          <span>/</span>
          <span className="text-gray-900">Cart</span>
        </nav>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-4">Add some products to get started!</p>
            <Link href="/products" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cartItems.map((item) => {
                        const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
                        
                        // Determine the price to use (variant price if available, otherwise product price)
                        let originalPrice = item.product.price;
                        if (item.variant_id && item.product.variants) {
                          const variant = item.product.variants.find((v: any) => v.id === item.variant_id);
                          if (variant && variant.price) {
                            originalPrice = variant.price;
                          }
                        }
                        
                        const itemDiscounts = productDiscounts[item.product.id] || [];
                        const { final_price, discount_amount, best_discount } = calculateBestDiscount({ price: originalPrice }, itemDiscounts);
                        const hasDiscount = discount_amount > 0;
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            {/* Product */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 h-16 flex-shrink-0">
                                  {primaryImage ? (
                                    <img
                                      src={primaryImage.image_url}
                                      alt={primaryImage.alt_text || item.product.name}
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">No image</span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <Link 
                                    href={`/products/${item.product.slug}`}
                                    className="text-sm font-medium text-gray-900 hover:text-primary-600"
                                  >
                                    {item.product.name}
                                  </Link>
                                  {item.product.brand && (
                                    <p className="text-sm text-gray-500">{item.product.brand.name}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              ${final_price.toFixed(2)}
                            </td>

                            {/* Quantity */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={updating === item.id || item.quantity <= 1}
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </button>
                                <span className="px-3 py-1 border border-gray-300 rounded min-w-[40px] text-center text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={updating === item.id}
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>

                            {/* Total */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${(final_price * item.quantity).toFixed(2)}
                            </td>

                            {/* Action */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => removeItem(item.id)}
                                disabled={updating === item.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                {/* Coupon Code Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Coupon Code</h3>
                  {appliedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {appliedCoupon.name} ({appliedCoupon.code})
                          </p>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.type === 'percentage' 
                              ? `${appliedCoupon.value}% off`
                              : appliedCoupon.type === 'fixed_amount'
                              ? `$${appliedCoupon.value} off`
                              : 'Free shipping'
                            }
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          disabled={couponLoading}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {couponLoading ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-600">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  
                  {/* Product Discounts */}
                  {totalProductDiscounts > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-gray-600">Product Discounts</span>
                      <span className="font-medium">-${totalProductDiscounts.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Coupon Discount - Show prominently */}
                  {discountAmount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-green-600 bg-green-50 px-3 py-2 rounded-md">
                      <span className="text-gray-600 font-medium">🎟️ Coupon Discount ({appliedCoupon.name})</span>
                      <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Automatic Discount */}
                  {automaticDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-gray-600">Automatic Discount ({appliedAutomaticDiscount?.name})</span>
                      <span className="font-medium">-${automaticDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${calculateTax().toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-gray-900">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Savings Summary */}
                  {(totalProductDiscounts > 0 || automaticDiscountAmount > 0 || discountAmount > 0) && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">You're saving money!</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Total savings: ${(totalProductDiscounts + automaticDiscountAmount + discountAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 mb-4"
                >
                  Proceed to Checkout
                </button>
                
                <Link 
                  href="/products" 
                  className="block w-full text-center text-primary-600 hover:text-primary-700 py-2"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
