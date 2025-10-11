'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';
import { Coupon, ProductWithDetails } from '@/types/database';
import { DiscountCalculator } from './discount-calculator';
import { getBatchProductDiscounts, calculateBestDiscount } from './discount-utils';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: ProductWithDetails;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
  // Coupon functionality
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (coupon: Coupon) => Promise<void>;
  removeCoupon: () => void;
  calculateTotal: () => { subtotal: number; discount: number; total: number };
  calculateSubtotal: () => number;
  calculateSubtotalWithDiscounts: () => Promise<number>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
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

  const addToCart = async (productId: string, variantId?: string, quantity: number = 1) => {
    if (!user) {
      throw new Error('User must be logged in to add items to cart');
    }

    try {
      setLoading(true);
      
      // Check if item already exists in cart
      const existingItem = cartItems.find(
        item => item.product_id === productId && item.variant_id === variantId
      );

      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity;
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (error) {
          console.error('Error updating cart item:', error);
          throw error;
        }

        setCartItems(prev => 
          prev.map(item => 
            item.id === existingItem.id 
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      } else {
        // Add new item to cart
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            variant_id: variantId,
            quantity: quantity
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding to cart:', error);
          throw error;
        }

        setCartItems(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }

      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating quantity:', error);
        throw error;
      }

      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error clearing cart:', error);
        throw error;
      }

      setCartItems([]);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (coupon: Coupon) => {
    try {
      // Calculate subtotal with product discounts applied
      const subtotalWithDiscounts = await calculateSubtotalWithDiscounts();
      
      // Validate coupon
      const validation = DiscountCalculator.isCouponValidForOrder(coupon, subtotalWithDiscounts);
      
      if (!validation.valid) {
        throw new Error(validation.reason || 'Invalid coupon');
      }

      // Calculate discount based on discounted subtotal
      const discount = DiscountCalculator.calculateCouponDiscount(coupon, subtotalWithDiscounts);
      
      setAppliedCoupon(coupon);
      setDiscountAmount(discount);
    } catch (error: any) {
      throw error;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const calculateSubtotal = (): number => {
    return cartItems.reduce((total, item) => {
      if (item.product) {
        const price = item.product.sale_price || item.product.price;
        return total + (price * item.quantity);
      }
      return total;
    }, 0);
  };

  const calculateSubtotalWithDiscounts = async (): Promise<number> => {
    if (cartItems.length === 0) return 0;
    
    try {
      // Get products with their discount information
      const products = cartItems.map(item => item.product).filter(Boolean) as ProductWithDetails[];
      
      if (products.length === 0) return calculateSubtotal();
      
      // Get batch discounts for all products
      const discountMap = await getBatchProductDiscounts(products);
      
      // Calculate total with discounts applied
      let totalWithDiscounts = 0;
      
      cartItems.forEach(item => {
        if (item.product) {
          const productDiscounts = discountMap[item.product.id] || [];
          const { final_price } = calculateBestDiscount(item.product, productDiscounts);
          totalWithDiscounts += final_price * item.quantity;
        }
      });
      
      return totalWithDiscounts;
    } catch (error) {
      console.error('Error calculating subtotal with discounts:', error);
      return calculateSubtotal();
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = discountAmount; // Use the stored discount amount
    const total = Math.max(0, subtotal - discount);
    
    return {
      subtotal,
      discount,
      total
    };
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      loading,
      appliedCoupon,
      discountAmount,
      applyCoupon,
      removeCoupon,
      calculateTotal,
      calculateSubtotal,
      calculateSubtotalWithDiscounts
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}




























