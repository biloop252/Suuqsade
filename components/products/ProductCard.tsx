'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductWithDetails } from '@/types/database';
import { 
  HeartIcon, 
  ShoppingCartIcon, 
  StarIcon,
  EyeIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';

interface ProductCardProps {
  product: ProductWithDetails;
  viewMode: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const currentPrice = product.sale_price || product.price;
  const originalPrice = product.price;
  const hasDiscount = currentPrice < originalPrice;

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
      alert('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
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
                    className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                  >
                    {product.brand.name}
                  </Link>
                )}
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-500 mt-1 mb-2 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                {product.short_description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.short_description}
                  </p>
                )}
                
                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">(4.2)</span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900">${currentPrice}</span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-500 line-through">${originalPrice}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <ShoppingCartIcon className="h-4 w-4 mr-2" />
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
                  <HeartIcon className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
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
          
          {/* Quick Actions */}
          <div className={`absolute top-2 right-2 flex flex-col space-y-2 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={handleToggleFavorite}
              className={`p-2 bg-white rounded-full shadow-md hover:bg-gray-50 ${
                isFavorite(product.id) ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              <HeartIcon className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
              <EyeIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-4">
        {product.brand && (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            {product.brand.name}
          </Link>
        )}
        
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-500 mt-1 mb-2 line-clamp-2 transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.short_description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-4 w-4 ${
                  i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">(4.2)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">${currentPrice}</span>
            {hasDiscount && (
              <span className="text-lg text-gray-500 line-through">${originalPrice}</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
