'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Coupon } from '@/types/database';
import { DiscountCalculator } from '@/lib/discount-calculator';

interface CouponContextType {
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (coupon: Coupon, orderAmount: number) => void;
  removeCoupon: () => void;
  calculateDiscount: (orderAmount: number) => number;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

interface CouponProviderProps {
  children: ReactNode;
}

export function CouponProvider({ children }: CouponProviderProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const applyCoupon = (coupon: Coupon, orderAmount: number) => {
    const calculatedDiscount = DiscountCalculator.calculateCouponDiscount(coupon, orderAmount);
    setAppliedCoupon(coupon);
    setDiscountAmount(calculatedDiscount);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const calculateDiscount = (orderAmount: number): number => {
    if (!appliedCoupon) return 0;
    return DiscountCalculator.calculateCouponDiscount(appliedCoupon, orderAmount);
  };

  const value: CouponContextType = {
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    calculateDiscount
  };

  return (
    <CouponContext.Provider value={value}>
      {children}
    </CouponContext.Provider>
  );
}

export function useCoupon() {
  const context = useContext(CouponContext);
  if (context === undefined) {
    throw new Error('useCoupon must be used within a CouponProvider');
  }
  return context;
}

