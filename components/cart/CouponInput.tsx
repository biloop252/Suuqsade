'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Coupon, DiscountType } from '@/types/database';
import { Check, X, Percent, DollarSign, Truck, Loader2 } from 'lucide-react';

interface CouponInputProps {
  onCouponApplied: (coupon: Coupon, discountAmount: number) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: Coupon | null;
  orderAmount: number;
  className?: string;
}

export default function CouponInput({ 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon, 
  orderAmount,
  className = '' 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateCoupon = async (code: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Call the database function to validate coupon
      const { data, error: validationError } = await supabase
        .rpc('is_coupon_valid', {
          p_coupon_code: code,
          p_user_id: null, // You might want to pass the current user ID
          p_order_amount: orderAmount
        });

      if (validationError) {
        throw validationError;
      }

      if (!data) {
        throw new Error('Invalid coupon code');
      }

      // Get coupon details
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .single();

      if (couponError || !couponData) {
        throw new Error('Coupon not found');
      }

      return couponData as Coupon;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountAmount = (coupon: Coupon, orderAmount: number): number => {
    switch (coupon.type) {
      case 'percentage':
        const percentageDiscount = (orderAmount * coupon.value) / 100;
        return coupon.maximum_discount_amount 
          ? Math.min(percentageDiscount, coupon.maximum_discount_amount)
          : percentageDiscount;
      case 'fixed_amount':
        return Math.min(coupon.value, orderAmount);
      case 'free_shipping':
        return 0; // This would be handled separately for shipping
      default:
        return 0;
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    try {
      const coupon = await validateCoupon(couponCode.trim().toUpperCase());
      const discountAmount = calculateDiscountAmount(coupon, orderAmount);
      
      onCouponApplied(coupon, discountAmount);
      setSuccess(`Coupon "${coupon.name}" applied successfully!`);
      setCouponCode('');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setSuccess('');
    setError('');
  };

  const getCouponIcon = (type: DiscountType) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed_amount':
        return <DollarSign className="h-4 w-4" />;
      case 'free_shipping':
        return <Truck className="h-4 w-4" />;
      default:
        return <Percent className="h-4 w-4" />;
    }
  };

  const formatCouponValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% off`;
      case 'fixed_amount':
        return `$${coupon.value} off`;
      case 'free_shipping':
        return 'Free Shipping';
      default:
        return `${coupon.value}% off`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-green-800">
                  {appliedCoupon.name}
                </div>
                <div className="text-xs text-green-600">
                  {formatCouponValue(appliedCoupon)}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800"
              title="Remove coupon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Coupon Input */}
      {!appliedCoupon && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <X className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">{success}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coupon Requirements */}
      {appliedCoupon && appliedCoupon.minimum_order_amount > 0 && (
        <div className="text-xs text-gray-500">
          Minimum order: ${appliedCoupon.minimum_order_amount}
        </div>
      )}
    </div>
  );
}

