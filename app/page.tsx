'use client';

import Link from 'next/link';
import { ShoppingBag, Star, Truck, ShieldCheck, Smartphone, Laptop, Shirt, Home, Gamepad, BookOpen, Sparkles, ChevronLeft, ChevronRight, CreditCard, ShoppingCart, Heart, Package, ShoppingBasket, Percent, Crown, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails } from '@/types/database';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useNotification } from '@/lib/notification-context';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import { ProductDiscount, getProductDiscounts, calculateBestDiscount, getBatchProductDiscounts } from '@/lib/discount-utils';
import DiscountBadge from '@/components/ui/DiscountBadge';
import ProductCard from '@/components/products/ProductCard';
import { getBatchProductReviewStats, formatRatingText, getStarDisplay } from '@/lib/review-utils';
import PromotionalMediaDisplay from '@/components/promotional/PromotionalMediaDisplay';
import PromotionalBanner from '@/components/promotional/PromotionalBanner';
import LimitedTimeDeals from '@/components/promotional/LimitedTimeDeals';
import HomepageMiddleSlider from '@/components/promotional/HomepageMiddleSlider';
import HomepageSections from '@/components/home/HomepageSections';

export default function HomePage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showSuccess, showError } = useNotification();
  
  const [flashProducts, setFlashProducts] = useState<ProductWithDetails[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductWithDetails[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<ProductWithDetails[]>([]);
  const [homeLivingProducts, setHomeLivingProducts] = useState<ProductWithDetails[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<Record<string, { averageRating: number; totalReviews: number }>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const [heroSlide, setHeroSlide] = useState(0);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  // Discount states for each product section
  const [flashProductDiscounts, setFlashProductDiscounts] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});
  const [recommendedProductDiscounts, setRecommendedProductDiscounts] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});
  const [bestSellingProductDiscounts, setBestSellingProductDiscounts] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});
  const [homeLivingProductDiscounts, setHomeLivingProductDiscounts] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});
  const [allProductDiscounts, setAllProductDiscounts] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});

  // Discount fetching function
  const fetchProductDiscounts = async (products: ProductWithDetails[], setDiscountState: React.Dispatch<React.SetStateAction<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>>) => {
    try {
      // Use batch discount fetching for better performance
      const discountMap = await getBatchProductDiscounts(products);
      
      const processedDiscountMap: Record<string, {
        discounts: ProductDiscount[];
        discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
      }> = {};

      // Calculate discount info for each product
      products.forEach(product => {
        const productDiscounts = discountMap[product.id] || [];
        const discountCalculation = calculateBestDiscount(product, productDiscounts);
        
        processedDiscountMap[product.id] = {
          discounts: productDiscounts,
          discountInfo: {
            final_price: discountCalculation.final_price,
            discount_amount: discountCalculation.discount_amount,
            has_discount: discountCalculation.discount_amount > 0
          }
        };
      });

      setDiscountState(processedDiscountMap);
    } catch (error) {
      console.error('Error fetching batch discounts:', error);
      
      // Fallback to individual fetching if batch fails
      const discountMap: Record<string, {
        discounts: ProductDiscount[];
        discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
      }> = {};

      for (const product of products) {
        try {
          const productDiscounts = await getProductDiscounts(product.id);
          const discountCalculation = calculateBestDiscount(product, productDiscounts);
          
          discountMap[product.id] = {
            discounts: productDiscounts,
            discountInfo: {
              final_price: discountCalculation.final_price,
              discount_amount: discountCalculation.discount_amount,
              has_discount: discountCalculation.discount_amount > 0
            }
          };
        } catch (error) {
          console.error(`Error fetching discounts for product ${product.id}:`, error);
          discountMap[product.id] = {
            discounts: [],
            discountInfo: {
              final_price: product.price,
              discount_amount: 0,
              has_discount: false
            }
          };
        }
      }

      setDiscountState(discountMap);
    }
  };

  // Handler functions
  const handleAddToCart = async (product: ProductWithDetails, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setAddingToCart(product.id);
      await addToCart(product.id, undefined, 1);
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
      setAddingToCart(null);
    }
  };

  const handleToggleFavorite = async (product: ProductWithDetails, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
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

  // Hero promotional banners carousel data - 8 plain images
  const heroBannerSlides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/products?sort=flash"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/products?sort=newest"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      href: "/products?shipping=free"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/auth/signup"
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/products?discount=50"
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      href: "/categories/electronics"
    },
    {
      id: 7,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/categories/fashion"
    },
    {
      id: 8,
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/categories/home-garden"
    }
  ];


  // Auto-slide effect for hero banner carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroBannerSlides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [heroBannerSlides.length]);


  // Function to fetch all products with pagination
  const fetchAllProducts = async (page: number = 1, append: boolean = false) => {
    try {
      setLoadingMore(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*),
          variants:product_variants(*),
          reviews:reviews(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (error) {
        console.error('Error fetching all products:', error);
        return;
      }

      if (data) {
        if (append) {
          setAllProducts(prev => [...prev, ...data]);
        } else {
          setAllProducts(data);
        }
        
        // Check if there are more products
        setHasMore(data.length === 20);
        
        // Fetch discounts for the new products
        if (data && data.length > 0) {
          fetchProductDiscounts(data, setAllProductDiscounts);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more products when scrolling
  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchAllProducts(nextPage, true);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [hasMore, loadingMore, currentPage]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch Flash Products
        const { data: flashData, error: flashError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*),
            variants:product_variants(*),
            reviews:reviews(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch Recommended Products (by created_at desc for now)
        const { data: recommendedData, error: recommendedError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*),
            variants:product_variants(*),
            reviews:reviews(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(15);

        // Fetch Best Selling Products (by review count)
        const { data: bestSellingData, error: bestSellingError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*),
            variants:product_variants(*),
            reviews:reviews(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(15);

        // Fetch Home & Living Products
        const { data: homeLivingData, error: homeLivingError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*),
            variants:product_variants(*),
            reviews:reviews(*)
          `)
          .eq('is_active', true)
          .eq('category.name', 'Home & Garden')
          .order('created_at', { ascending: false })
          .limit(12);

        if (flashError) {
          console.error('Error fetching flash products:', flashError);
          setFlashProducts([]);
        } else {
          setFlashProducts(flashData || []);
          // Fetch discounts for flash products
          if (flashData && flashData.length > 0) {
            fetchProductDiscounts(flashData, setFlashProductDiscounts);
          }
        }

        if (recommendedError) {
          console.error('Error fetching recommended products:', recommendedError);
          setRecommendedProducts([]);
        } else {
          setRecommendedProducts(recommendedData || []);
          // Fetch discounts for recommended products
          if (recommendedData && recommendedData.length > 0) {
            fetchProductDiscounts(recommendedData, setRecommendedProductDiscounts);
          }
        }

        if (bestSellingError) {
          console.error('Error fetching best selling products:', bestSellingError);
          setBestSellingProducts([]);
        } else {
          setBestSellingProducts(bestSellingData || []);
          // Fetch discounts for best selling products
          if (bestSellingData && bestSellingData.length > 0) {
            fetchProductDiscounts(bestSellingData, setBestSellingProductDiscounts);
          }
        }

        if (homeLivingError) {
          console.error('Error fetching home & living products:', homeLivingError);
          setHomeLivingProducts([]);
        } else {
          setHomeLivingProducts(homeLivingData || []);
          // Fetch discounts for home living products
          if (homeLivingData && homeLivingData.length > 0) {
            fetchProductDiscounts(homeLivingData, setHomeLivingProductDiscounts);
          }
        }

        // Fetch initial batch of all products
        await fetchAllProducts(1, false);
        
        // Fetch discounts for all products
        if (allProducts && allProducts.length > 0) {
          fetchProductDiscounts(allProducts, setAllProductDiscounts);
        }
        
        // Fetch review stats for all products
        const allProductIds = [
          ...flashData?.map(p => p.id) || [],
          ...recommendedData?.map(p => p.id) || [],
          ...bestSellingData?.map(p => p.id) || [],
          ...homeLivingData?.map(p => p.id) || [],
          ...allProducts?.map(p => p.id) || []
        ];
        
        if (allProductIds.length > 0) {
          try {
            const stats = await getBatchProductReviewStats(allProductIds);
            setReviewStats(stats);
          } catch (error) {
            console.error('Error fetching review stats:', error);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setFlashProducts([]);
        setRecommendedProducts([]);
        setBestSellingProducts([]);
        setHomeLivingProducts([]);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Timer effect for Flash Products
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.seconds > 0) {
          return { ...prevTime, seconds: prevTime.seconds - 1 };
        } else if (prevTime.minutes > 0) {
          return { ...prevTime, minutes: prevTime.minutes - 1, seconds: 59 };
        } else if (prevTime.hours > 0) {
          return { hours: prevTime.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset timer when it reaches 0
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Promotional Banners - Carousel + Single Image */}
      <section className="bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          {/* Section 1: Dynamic Hero Carousel from Admin Panel */}
          <div className="relative overflow-hidden lg:col-span-2">
            <PromotionalMediaDisplay 
              position="homepage_top" 
              className="h-64"
              maxItems={5}
            />
          </div>

          {/* Section 2: Dynamic Right Side Banners */}
          <div className="space-y-2">
            <PromotionalBanner 
              position="homepage_middle" 
              className="h-32"
              showTitle={true}
              showDescription={false}
            />
            <PromotionalBanner 
              position="homepage_bottom" 
              className="h-32"
              showTitle={true}
              showDescription={false}
            />
          </div>
              </div>
      </section>

      {/* Limited Time Deals Section */}
      <LimitedTimeDeals />

      {/* Admin-configured Homepage Sections */}
      <HomepageSections />


      {/* Homepage Middle Slider Section */}
      <HomepageMiddleSlider />

      {/* All Products Section */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {loading ? (
              // Loading skeleton
              [...Array(20)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
                  <div className="w-full h-56 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
                  </div>
                </div>
              ))
            ) : (
              allProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  discountData={allProductDiscounts[product.id]}
                  hideBrand={true}
                />
              ))
            )}
          </div>
          
          {/* Loading More Products */}
          {loadingMore && (
            <div className="flex justify-center mt-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
                {[...Array(10)].map((_, index) => (
                  <div key={`loading-${index}`} className="bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
                    <div className="w-full h-56 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Infinite Scroll Trigger */}
          <div id="load-more-trigger" className="h-10 w-full"></div>
          
          {/* End of Products Message */}
          {!hasMore && allProducts.length > 0 && (
            <div className="text-center mt-8 py-8">

            </div>
          )}
        </div>
      </section>




    </div>
  );
}


