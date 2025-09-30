'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails } from '@/types/database';
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  StarIcon, 
  TruckIcon, 
  ShieldCheckIcon,
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import LocationSelector from '@/components/products/LocationSelector';
import DeliveryCalculator from '@/components/products/DeliveryCalculator';

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);

  useEffect(() => {
    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          vendor:vendor_profiles(business_name, city, country, logo_url),
          images:product_images(*),
          variants:product_variants(*),
          reviews:reviews(*)
        `)
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      // Redirect to sign in
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product?.id || '', selectedVariant?.id, quantity);
      alert('Item added to cart successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }

    if (!product) return;

    try {
      await toggleFavorite(product);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleLocationSelect = (country: string, city: string) => {
    setSelectedCountry(country);
    setSelectedCity(city);
    setSelectedDeliveryOption(null); // Reset delivery option when location changes
  };

  const handleDeliveryOptionSelect = (option: any) => {
    setSelectedDeliveryOption(option);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link href="/products" className="btn-primary">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.sale_price || selectedVariant?.price || product.sale_price || product.price;
  const originalPrice = selectedVariant?.price || product.price;
  const hasDiscount = currentPrice < originalPrice;

  const images = product.images || [];
  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-600">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-primary-600">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              {primaryImage ? (
                <Image
                  src={primaryImage.image_url}
                  alt={primaryImage.alt_text || product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={(e) => {
                    console.error('Image failed to load:', primaryImage.image_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg shadow-sm overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary-600' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image.image_url}
                      alt={image.alt_text || product.name}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error('Thumbnail image failed to load:', image.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-6">
              {product.brand && (
                <Link
                  href={`/brands/${product.brand.slug}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {product.brand.name}
                </Link>
              )}
              {(product as any).vendor && (
                <div className="flex items-center mt-2 mb-2">
                  <span className="text-sm text-gray-500 mr-2">Sold by:</span>
                  <div className="flex items-center">
                    {(product as any).vendor.logo_url && (
                      <img
                        src={(product as any).vendor.logo_url}
                        alt={`${(product as any).vendor.business_name} logo`}
                        className="h-6 w-6 rounded-full object-cover mr-2"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {(product as any).vendor.business_name}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({(product as any).vendor.city}, {(product as any).vendor.country})
                    </span>
                  </div>
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{product.name}</h1>
              
              {/* Price */}
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-gray-900">${currentPrice}</span>
                {hasDiscount && (
                  <span className="text-xl text-gray-500 line-through">${originalPrice}</span>
                )}
                {hasDiscount && (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                    {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.2) • 128 reviews</span>
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-gray-600 mb-6">{product.short_description}</p>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Options</h3>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full text-left p-3 border rounded-lg ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{variant.name}</span>
                        <span className="text-primary-600">
                          ${variant.sale_price || variant.price}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`p-3 border rounded-md hover:bg-gray-50 ${
                  product && isFavorite(product.id)
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <HeartIcon className={`h-5 w-5 ${product && isFavorite(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Delivery Section */}
            <div className="mb-8">
              <LocationSelector
                onLocationSelect={handleLocationSelect}
                selectedCountry={selectedCountry}
                selectedCity={selectedCity}
              />
              
              {selectedCountry && selectedCity && product && (
                <div className="mt-4">
                  <DeliveryCalculator
                    productId={product.id}
                    deliveryCity={selectedCity}
                    deliveryCountry={selectedCountry}
                    onDeliveryOptionSelect={handleDeliveryOptionSelect}
                    selectedOption={selectedDeliveryOption}
                  />
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <TruckIcon className="h-5 w-5 mr-3 text-primary-600" />
                Free shipping on orders over $50
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ShieldCheckIcon className="h-5 w-5 mr-3 text-primary-600" />
                30-day return policy
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Be the first to review this product!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
