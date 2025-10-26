'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductWithDetails } from '@/types/database';
import { 
  Heart, 
  ShoppingBasket, 
  Star,
  Eye,
  Percent
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useNotification } from '@/lib/notification-context';
import { useFavorites } from '@/lib/favorites-context';
import { ProductDiscount, calculateBestDiscount } from '@/lib/discount-utils';
import DiscountBadge from '@/components/ui/DiscountBadge';
import { getProductReviewStats, formatRatingText, getStarDisplay } from '@/lib/review-utils';

interface ProductCardProps {
  product: ProductWithDetails;
  viewMode?: 'grid' | 'list';
  discountData?: {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  };
}

export default function ProductCard({ product, viewMode = 'grid', discountData }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showSuccess, showError } = useNotification();
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [discounts, setDiscounts] = useState<ProductDiscount[]>([]);
  const [discountInfo, setDiscountInfo] = useState<{
    final_price: number;
    discount_amount: number;
    has_discount: boolean;
  }>({
    final_price: product.price,
    discount_amount: 0,
    has_discount: false
  });
  const [reviewStats, setReviewStats] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({
    averageRating: 0,
    totalReviews: 0
  });

  // Use passed discount data or fetch individually as fallback
  useEffect(() => {
    if (discountData) {
      // Use pre-calculated discount data
      setDiscounts(discountData.discounts);
      setDiscountInfo(discountData.discountInfo);
    } else {
      // Fallback to individual fetching (for backward compatibility)
      const fetchDiscounts = async () => {
        try {
          const { getProductDiscounts } = await import('@/lib/discount-utils');
          const productDiscounts = await getProductDiscounts(product.id);
          setDiscounts(productDiscounts);
          
          const discountCalculation = calculateBestDiscount(product, productDiscounts);
          setDiscountInfo({
            final_price: discountCalculation.final_price,
            discount_amount: discountCalculation.discount_amount,
            has_discount: discountCalculation.discount_amount > 0
          });
        } catch (error) {
          console.error('Error fetching discounts:', error);
        }
      };

      fetchDiscounts();
    }
  }, [product.id, product.price, discountData]);

  // Fetch review stats
  useEffect(() => {
    const fetchReviewStats = async () => {
      try {
        const stats = await getProductReviewStats(product.id);
        setReviewStats(stats);
      } catch (error) {
        console.error('Error fetching review stats:', error);
      }
    };

    fetchReviewStats();
  }, [product.id]);

  const currentPrice = discountInfo.has_discount ? discountInfo.final_price : product.price;
  const originalPrice = product.price;
  const hasDiscount = discountInfo.has_discount && discountInfo.discount_amount > 0;

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id);
      showSuccess(
        'Added to Cart!',
        `${product.name} has been added to your cart`
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError(
        'Failed to Add to Cart',
        'There was an error adding this item to your cart. Please try again.'
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      await toggleFavorite(product);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
        <div className="flex">
          {/* Image */}
          <div className="w-48 h-48 flex-shrink-0">
            <Link href={`/products/${product.slug}`}>
              <div className="w-full h-full bg-gray-100 rounded-l-lg overflow-hidden relative group">
                {primaryImage ? (
                  <Image
                    src={primaryImage.image_url}
                    alt={primaryImage.alt_text || product.name}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                    onError={(e) => {
                      console.error('Image failed to load:', primaryImage.image_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
                
                {/* Discount Badge Overlay */}
                {hasDiscount && discountInfo.discount_amount > 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <DiscountBadge
                      discountAmount={discountInfo.discount_amount}
                      discountType={discounts.find(d => d.id === discounts[0]?.id)?.type || 'percentage'}
                      discountValue={discounts.find(d => d.id === discounts[0]?.id)?.value || 0}
                    />
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {product.brand && (
                  <Link
                    href={`/brands/${product.brand.slug}`}
                    className="text-primary-500 hover:text-orange-600 text-sm font-medium"
                  >
                    {product.brand.name}
                  </Link>
                )}
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-primary-500 mt-1 mb-2 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                {product.short_description && (
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                    {product.short_description}
                  </p>
                )}
                
                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          i < getStarDisplay(reviewStats.averageRating).filledStars 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {reviewStats.totalReviews > 0 
                      ? `(${reviewStats.averageRating.toFixed(1)})` 
                      : 'No reviews'
                    }
                  </span>
                </div>

                {/* Price */}
                <div className="flex flex-col">
                  {hasDiscount && currentPrice < originalPrice ? (
                    <>
                      <span className="text-base sm:text-xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
                      <span className="text-xs sm:text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-base sm:text-xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <ShoppingBasket className="h-4 w-4 mr-2" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center justify-center px-4 py-2 border rounded-md hover:bg-gray-50 ${
                    isFavorite(product.id) 
                      ? 'border-red-300 bg-red-50 text-red-600' 
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 group border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={primaryImage.alt_text || product.name}
              width={500}
              height={500}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
              onError={(e) => {
                console.error('Image failed to load:', primaryImage.image_url);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
          
          {/* Discount Badge Overlay */}
          {hasDiscount && discountInfo.discount_amount > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <DiscountBadge
                discountAmount={discountInfo.discount_amount}
                discountType={discounts.find(d => d.id === discounts[0]?.id)?.type || 'percentage'}
                discountValue={discounts.find(d => d.id === discounts[0]?.id)?.value || 0}
              />
            </div>
          )}
          
          {/* Quick Actions */}
          <div className={`absolute top-2 right-2 flex flex-col space-y-2 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 ${
                isFavorite(product.id) ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600">
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-4">
        {product.brand && (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="text-primary-500 hover:text-orange-600 text-sm font-medium"
          >
            {product.brand.name}
          </Link>
        )}
        
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-primary-500 mt-1 mb-2 line-clamp-2 transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.short_description && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 sm:h-4 sm:w-4 ${
                  i < getStarDisplay(reviewStats.averageRating).filledStars 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {reviewStats.totalReviews > 0 ? formatRatingText(reviewStats.averageRating, reviewStats.totalReviews) : <span className="hidden sm:inline">No reviews</span>}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && currentPrice < originalPrice ? (
              <>
                <span className="text-lg font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
                <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="w-10 h-10 flex items-center justify-center bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBasket className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
