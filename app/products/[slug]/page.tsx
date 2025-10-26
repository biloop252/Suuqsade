'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails } from '@/types/database';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  ShieldCheck,
  ArrowLeft,
  Minus,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import { useNotification } from '@/lib/notification-context';
import { ProductDiscount, getBatchProductDiscounts, calculateBestDiscount } from '@/lib/discount-utils';
import DiscountBadge from '@/components/ui/DiscountBadge';
import LocationSelector from '@/components/products/LocationSelector';
import DeliveryCalculator from '@/components/products/DeliveryCalculator';
import ProductOptions from '@/components/products/ProductOptions';
import ReviewDisplay from '@/components/reviews/ReviewDisplay';
import ProductCard from '@/components/products/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showSuccess, showError } = useNotification();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
  const [attributeSelections, setAttributeSelections] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [dynamicPrice, setDynamicPrice] = useState<{ basePrice: number } | null>(null);
  const [discounts, setDiscounts] = useState<ProductDiscount[]>([]);
  const [discountInfo, setDiscountInfo] = useState<{
    final_price: number;
    discount_amount: number;
    has_discount: boolean;
  }>({
    final_price: 0,
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
  const [relatedProducts, setRelatedProducts] = useState<ProductWithDetails[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductWithDetails[]>([]);
  const [productTags, setProductTags] = useState<Array<{ id: string; name: string; slug: string; description?: string }>>([]);
  const [sellerStats, setSellerStats] = useState<{
    averageRating: number;
    totalReviews: number;
    totalUnitsSold: number;
    positiveRatingPercent: number;
  }>({
    averageRating: 0,
    totalReviews: 0,
    totalUnitsSold: 0,
    positiveRatingPercent: 0
  });

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
          vendor:vendor_profiles(business_name, business_description, city, country, logo_url),
          images:product_images(*),
          variants:product_variants(*),
          reviews:reviews(*),
          tag_assignments:product_tag_assignments(
            tag:product_tags(*)
          )
        `)
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProduct(data);
        // Initialize dynamic price with base product price
        setDynamicPrice({
          basePrice: data.price
        });
        
        // Fetch discounts immediately after product is loaded
        try {
          const discountMap = await getBatchProductDiscounts([data]);
          const productDiscounts = discountMap[data.id] || [];
          
          setDiscounts(productDiscounts);
          
          const discountCalculation = calculateBestDiscount(data, productDiscounts);
          setDiscountInfo({
            final_price: discountCalculation.final_price,
            discount_amount: discountCalculation.discount_amount,
            has_discount: discountCalculation.discount_amount > 0
          });
        } catch (discountError) {
          console.error('Error fetching discounts:', discountError);
        }
        
        // Fetch review statistics
        try {
          const { data: reviewData, error: reviewError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', data.id)
            .eq('is_approved', true);
            
          if (reviewError) {
            console.error('Error fetching reviews:', reviewError);
          } else if (reviewData && reviewData.length > 0) {
            const totalRating = reviewData.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviewData.length;
            setReviewStats({
              averageRating,
              totalReviews: reviewData.length
            });
          }
        } catch (reviewError) {
          console.error('Error fetching review stats:', reviewError);
        }

        // Fetch related and recommended products
        try {
          await fetchRelatedAndRecommended(data as ProductWithDetails);
        } catch (relatedErr) {
          console.error('Error fetching related/recommended products:', relatedErr);
        }

        // Fallback: fetch product tags explicitly (in case nested join doesn't return due to policies/links)
        try {
          const { data: tagRows, error: tagsError } = await supabase
            .from('product_tag_assignments')
            .select('tag:product_tags(*)')
            .eq('product_id', data.id);
          if (tagsError) {
            console.error('Error fetching product tags:', tagsError);
          } else {
            const tags = (tagRows || [])
              .map((r: any) => r?.tag)
              .filter(Boolean)
              .map((t: any) => ({ id: t.id, name: t.name, slug: t.slug, description: t.description }));
            setProductTags(tags);
          }
        } catch (tagsErr) {
          console.error('Error:', tagsErr);
        }

        // Fetch seller stats if vendor_id exists
        try {
          if (data.vendor_id) {
            await fetchSellerStats(data.vendor_id);
          }
        } catch (sellerErr) {
          console.error('Error fetching seller stats:', sellerErr);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedAndRecommended = async (p: ProductWithDetails) => {
    try {
      const baseSelect = `
        *,
        category:categories(*),
        brand:brands(*),
        images:product_images(*),
        variants:product_variants(*),
        reviews:reviews(*)
      `;

      // Related by category
      if (p.category_id) {
        const { data: related } = await supabase
          .from('products')
          .select(baseSelect)
          .eq('is_active', true)
          .eq('category_id', p.category_id)
          .neq('id', p.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setRelatedProducts(related || []);
      } else {
        setRelatedProducts([]);
      }

      // Recommended by brand (fallback to category or recent)
      let query = supabase
        .from('products')
        .select(baseSelect)
        .eq('is_active', true)
        .neq('id', p.id);

      if (p.brand_id) {
        query = query.eq('brand_id', p.brand_id);
      } else if (p.category_id) {
        query = query.eq('category_id', p.category_id);
      }

      const { data: rec } = await query
        .order('created_at', { ascending: false })
        .limit(10);
      setRecommendedProducts(rec || []);
    } catch (err) {
      console.error('Error in fetchRelatedAndRecommended:', err);
    }
  };

  const fetchSellerStats = async (vendorId: string) => {
    try {
      // Get all product IDs for this vendor
      const { data: vendorProducts, error: vpError } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('is_active', true);

      if (vpError) {
        console.error('Error fetching vendor products:', vpError);
        return;
      }

      const productIds = (vendorProducts || []).map(p => p.id);
      if (productIds.length === 0) {
        setSellerStats({ averageRating: 0, totalReviews: 0, totalUnitsSold: 0, positiveRatingPercent: 0 });
        return;
      }

      // Fetch approved reviews for these products
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .in('product_id', productIds)
        .eq('is_approved', true);

      if (reviewsError) {
        console.error('Error fetching vendor reviews:', reviewsError);
      }

      const totalReviews = reviewsData?.length || 0;
      const averageRating = totalReviews > 0
        ? (reviewsData!.reduce((sum, r) => sum + (r as any).rating, 0) / totalReviews)
        : 0;
      const positiveCount = reviewsData?.filter((r: any) => (r.rating || 0) >= 4).length || 0;
      const positiveRatingPercent = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

      // Fetch units sold via server-side function so it's consistent for all users
      let totalUnitsSold = 0;
      try {
        const { data: unitsSoldData, error: unitsError } = await supabase
          .rpc('get_vendor_units_sold', { vendor_uuid: vendorId });
        if (unitsError) {
          console.error('Error fetching vendor units sold via RPC:', unitsError);
        } else if (typeof unitsSoldData === 'number') {
          totalUnitsSold = unitsSoldData as number;
        }
      } catch (rpcErr) {
        console.error('RPC error:', rpcErr);
      }

      setSellerStats({ averageRating, totalReviews, totalUnitsSold, positiveRatingPercent });
    } catch (error) {
      console.error('Error computing seller stats:', error);
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
      showSuccess(
        'Added to Cart!',
        `${product?.name} has been added to your cart`
      );
    } catch (error) {
      console.error('Error:', error);
      showError(
        'Failed to Add to Cart',
        'There was an error adding this item to your cart. Please try again.'
      );
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

  const handleAttributeChange = async (selections: Record<string, string>) => {
    setAttributeSelections(selections);
    console.log('Attribute selections changed:', selections);
    console.log('Product variants:', product?.variants);
    
    // Calculate dynamic price based on selected attributes
    if (product && Object.keys(selections).length > 0) {
      try {
        // Create a mapping from attribute slugs to IDs by fetching attribute metadata
        const attributeIds = new Set<string>();
        product.variants?.forEach(variant => {
          if (variant.attributes) {
            Object.keys(variant.attributes).forEach(id => attributeIds.add(id));
          }
        });

        // Fetch attribute metadata to create slug-to-ID mapping
        const { data: attributesData } = await supabase
          .from('product_attributes')
          .select('id, slug')
          .in('id', Array.from(attributeIds));

        const slugToIdMap = new Map<string, string>();
        attributesData?.forEach(attr => {
          slugToIdMap.set(attr.slug, attr.id);
        });

        // Find variant by matching attributes in the JSONB field
        const matchingVariant = product.variants?.find(variant => {
          if (!variant.attributes) return false;
          
          console.log('Checking variant:', variant.name, 'with attributes:', variant.attributes);
          
          // Check if all selected attributes match this variant's attributes
          const matches = Object.keys(selections).every(attrSlug => {
            const attributeId = slugToIdMap.get(attrSlug);
            
            if (!attributeId) {
              console.log(`No attribute ID found for slug: ${attrSlug}`);
              return false;
            }
            
            const variantAttrValue = variant.attributes![attributeId];
            const selectionValue = selections[attrSlug];
            console.log(`Comparing ${attrSlug} (ID: ${attributeId}): variant="${variantAttrValue}" vs selection="${selectionValue}"`);
            return variantAttrValue === selectionValue;
          });
          
          console.log('Variant matches:', matches);
          return matches;
        });

        console.log('Matching variant found:', matchingVariant);

        if (matchingVariant) {
          setSelectedVariant(matchingVariant);
          setDynamicPrice({
            basePrice: matchingVariant.price || 0
          });
        } else {
          // If no matching variant, use base product price
          setSelectedVariant(null);
          setDynamicPrice({
            basePrice: product.price
          });
        }
      } catch (error) {
        console.error('Error calculating dynamic price:', error);
        // Fallback to base product price
        setDynamicPrice({
          basePrice: product.price
        });
      }
    } else {
      // No selections, use base product price
      setDynamicPrice({
        basePrice: product?.price || 0
      });
    }
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
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Calculate current price based on dynamic pricing and discounts only
  const basePrice = dynamicPrice?.basePrice || product?.price || 0;
  const currentPrice = discountInfo.has_discount ? discountInfo.final_price : basePrice;
  const originalPrice = basePrice;
  const hasDiscount = discountInfo.has_discount && discountInfo.discount_amount > 0;

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Product Images */}
          <div className="lg:col-span-4">
            <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage].image_url}
                  alt={images[selectedImage].alt_text || product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={(e) => {
                    console.error('Image failed to load:', images[selectedImage].image_url);
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
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
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

            {/* Product Description (desktop only) */}
            {product.description && (
              <div className="mt-6 hidden lg:block">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Description</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="lg:col-span-5">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{product.name}</h1>
              
              {product.brand && (
                <Link
                  href={`/brands/${product.brand.slug}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {product.brand.name}
                </Link>
              )}
              
              {/* Price */}
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
                {hasDiscount && currentPrice < originalPrice && (
                  <span className="text-lg sm:text-xl text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                )}
                {hasDiscount && (
                  <DiscountBadge
                    discountAmount={discountInfo.discount_amount}
                    discountType={discounts[0]?.type || 'percentage'}
                    discountValue={discounts[0]?.value || 0}
                  />
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        i < Math.round(reviewStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {reviewStats.totalReviews > 0 
                    ? `(${reviewStats.averageRating.toFixed(1)}) • ${reviewStats.totalReviews} review${reviewStats.totalReviews !== 1 ? 's' : ''}`
                    : <span className="hidden sm:inline">No reviews yet</span>
                  }
                </span>
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-gray-600 text-sm sm:text-base mb-6">{product.short_description}</p>
              )}

          

              {/* Discount Information */}
              {hasDiscount && discounts.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">🎉 Special Offers Available!</h3>
                  <div className="space-y-2">
                    {discounts.map((discount, index) => (
                      <div key={discount.id} className="flex items-center justify-between text-sm">
                        <span className="text-green-700 font-medium">{discount.name}</span>
                        <span className="text-green-600">
                          {discount.type === 'percentage' 
                            ? `${discount.value}% OFF` 
                            : discount.type === 'fixed_amount' 
                            ? `$${discount.value} OFF`
                            : 'FREE SHIPPING'
                          }
                        </span>
                      </div>
                    ))}
                    <div className="text-xs text-green-600 mt-2">
                      💰 You save ${discountInfo.discount_amount.toFixed(2)} on this item!
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Options */}
              <div className="mb-6">
              <ProductOptions 
                productId={product.id} 
                onAttributeChange={handleAttributeChange}
              />
                      </div>
                      

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 bg-primary-600 text-white px-5 py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`p-3 border rounded-md hover:bg-gray-50 flex items-center justify-center ${
                  product && isFavorite(product.id)
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <Heart className={`h-5 w-5 ${product && isFavorite(product.id) ? 'fill-current' : ''}`} />
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

            {/* Product Description (mobile below delivery) */}
            {product.description && (
              <div className="mb-8 block lg:hidden">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Description</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Seller Information */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
              
              {(product as any).vendor ? (
                <div className="space-y-4">
                  {/* Seller Profile */}
                  <div className="flex items-center space-x-3">
                    {(product as any).vendor.logo_url && (
                      <img
                        src={(product as any).vendor.logo_url}
                        alt={`${(product as any).vendor.business_name} logo`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{(product as any).vendor.business_name}</h4>
                      <p className="text-sm text-gray-500">
                        {(product as any).vendor.city}, {(product as any).vendor.country}
                      </p>
                    </div>
                  </div>

                  {/* Seller Rating */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Seller Rating</span>
                      <span className="text-sm text-gray-500">{sellerStats.averageRating.toFixed(1)}/5</span>
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(sellerStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Based on {sellerStats.totalReviews} reviews</p>
                  </div>

                  {/* Seller Stats */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{sellerStats.positiveRatingPercent}%</p>
                        <p className="text-xs text-gray-500">Positive Rating</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{sellerStats.totalUnitsSold}</p>
                        <p className="text-xs text-gray-500">Products Sold</p>
                      </div>
                    </div>
                  </div>

                  {/* Seller Description */}
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">About This Seller</h5>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {(product as any).vendor.business_description || `${(product as any).vendor.business_name} is a trusted seller.`}
                    </p>
                  </div>

                  {/* View Seller Button */}
                  <div className="border-t pt-4">
                    <Link href={`/vendors/${(product as any).vendor_id || ''}`} className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium text-center">
                      View Seller
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-xl">🏪</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Suuqsade Store</h4>
                  <p className="text-sm text-gray-500 mb-4">Official Suuqsade seller</p>
                  
                  {/* Default Rating */}
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">4.9/5 based on 2.5k reviews</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ReviewDisplay 
            productId={product.id} 
            productName={product.name} 
          />
        </div>

        {/* Tags - moved below reviews */}
        {(product.category || product.brand || (product as any).tag_assignments?.length > 0 || productTags.length > 0) && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  #{product.category.name}
                </Link>
              )}
              {product.brand && (
                <Link
                  href={`/brands/${product.brand.slug}`}
                  className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  #{product.brand.name}
                </Link>
              )}
              {(product as any).tag_assignments?.map((ta: any) => (
                ta?.tag ? (
                  <Link
                    key={ta.tag.id}
                    href={`/tags/${ta.tag.slug}`}
                    className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                    title={ta.tag.description || ''}
                  >
                    #{ta.tag.name}
                  </Link>
                ) : null
              ))}
              {productTags.map((t) => (
                <Link
                  key={`fallback-${t.id}`}
                  href={`/tags/${t.slug}`}
                  className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                  title={t.description || ''}
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}

        {/* You May Also Like */}
        {recommendedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recommendedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
