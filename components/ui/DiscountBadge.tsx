'use client';

import { PercentIcon, TagIcon } from 'lucide-react';

interface DiscountBadgeProps {
  discountAmount: number;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  className?: string;
}

export default function DiscountBadge({ 
  discountAmount, 
  discountType, 
  discountValue, 
  className = '' 
}: DiscountBadgeProps) {
  if (discountAmount <= 0) return null;

  const getBadgeText = () => {
    switch (discountType) {
      case 'percentage':
        return `${discountValue}% OFF`;
      case 'fixed_amount':
        return `$${discountValue} OFF`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      default:
        return 'DISCOUNT';
    }
  };

  const getBadgeColor = () => {
    switch (discountType) {
      case 'free_shipping':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-red-100 text-red-600';
    }
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor()} ${className}`}>
      {discountType === 'free_shipping' ? (
        <TagIcon className="h-3 w-3 mr-1" />
      ) : (
        <PercentIcon className="h-3 w-3 mr-1" />
      )}
      {getBadgeText()}
    </div>
  );
}

