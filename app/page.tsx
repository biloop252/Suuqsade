'use client';

import Link from 'next/link';
import { ShoppingBagIcon, StarIcon, TruckIcon, ShieldCheckIcon, SmartphoneIcon, LaptopIcon, ShirtIcon, HomeIcon, GamepadIcon, BookOpenIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, CreditCardIcon, ShoppingCartIcon, ZapIcon, HeartIcon, PackageIcon, ShoppingBasketIcon, PercentIcon, CrownIcon, GiftIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails } from '@/types/database';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';

export default function HomePage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [flashProducts, setFlashProducts] = useState<ProductWithDetails[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductWithDetails[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<ProductWithDetails[]>([]);
  const [homeLivingProducts, setHomeLivingProducts] = useState<ProductWithDetails[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

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
      // You could add a toast notification here
    } catch (error) {
      console.error('Error adding to cart:', error);
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

  // Hero carousel data - Promotional offers with images
  const heroSlides = [
    {
      id: 1,
      title: "Flash Sale",
      subtitle: "Limited time offer",
      badge: "Up to 80% off",
      description: "Don't miss out on incredible deals",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/products?sort=flash",
      cta: "Shop Now"
    },
    {
      id: 2,
      title: "New Arrivals",
      subtitle: "Fresh products daily",
      badge: "Just In",
      description: "Discover the latest trends",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/products?sort=newest",
      cta: "Explore"
    },
    {
      id: 3,
      title: "Free Shipping",
      subtitle: "On orders over $50",
      badge: "No minimum",
      description: "Fast and reliable delivery",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      href: "/products?shipping=free",
      cta: "Learn More"
    },
    {
      id: 4,
      title: "Member Exclusive",
      subtitle: "Special member deals",
      badge: "VIP Access",
      description: "Join our loyalty program",
      image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/auth/signup",
      cta: "Join Now"
    },
    {
      id: 5,
      title: "Weekend Special",
      subtitle: "End of week deals",
      badge: "50% off",
      description: "Weekend shopping made better",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      href: "/products?discount=50",
      cta: "Shop Deals"
    }
  ];

  // Auto-slide effect for hero banner carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroBannerSlides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [heroBannerSlides.length]);

  // Auto-slide effect for promotional carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [heroSlides.length]);

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
        }

        if (recommendedError) {
          console.error('Error fetching recommended products:', recommendedError);
          setRecommendedProducts([]);
        } else {
          setRecommendedProducts(recommendedData || []);
        }

        if (bestSellingError) {
          console.error('Error fetching best selling products:', bestSellingError);
          setBestSellingProducts([]);
        } else {
          setBestSellingProducts(bestSellingData || []);
        }

        if (homeLivingError) {
          console.error('Error fetching home & living products:', homeLivingError);
          setHomeLivingProducts([]);
        } else {
          setHomeLivingProducts(homeLivingData || []);
        }

        // Fetch initial batch of all products
        await fetchAllProducts(1, false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Promotional Banners - Carousel + Single Image */}
      <section className="bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          {/* Section 1: Hero Carousel with 8 Plain Images */}
          <div className="relative overflow-hidden lg:col-span-2">
            <div className="relative h-64">
              {/* Slides */}
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${heroSlide * 100}%)` }}
              >
                {heroBannerSlides.map((slide) => (
                  <Link
                    key={slide.id}
                    href={slide.href}
                    className="w-full flex-shrink-0 relative"
                  >
                    <div className="h-full relative group cursor-pointer overflow-hidden">
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      />
                </div>
                  </Link>
                ))}
                </div>
              
              {/* Navigation Arrows */}
              <button
                onClick={() => setHeroSlide((prev) => (prev - 1 + heroBannerSlides.length) % heroBannerSlides.length)}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300"
              >
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                </button>
              
              <button
                onClick={() => setHeroSlide((prev) => (prev + 1) % heroBannerSlides.length)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300"
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
            {/* Dots Indicator */}
            <div className="flex justify-center mt-3 space-x-1">
              {heroBannerSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setHeroSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === heroSlide 
                      ? 'bg-orange-500 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
                </div>
                  </div>

          {/* Section 2: Single Plain Image */}
          <div className="relative overflow-hidden lg:col-span-1">
            <Link href="/categories/home-garden" className="block">
              <div className="h-64 relative group cursor-pointer overflow-hidden">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)` }}
                />
                  </div>
            </Link>
                </div>
              </div>
      </section>

      {/* Limited Time Deals Section */}
      <section className="py-6 bg-gradient-to-r from-red-50 to-orange-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-100/20 to-orange-100/20"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-200/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-200/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-3 shadow-lg">
                <ZapIcon className="h-7 w-7 text-white animate-pulse" />
                </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Limited Time Deals
                </h2>
                <p className="text-gray-600 font-medium">Don't miss out on these exclusive offers</p>
            </div>
          </div>

            <Link href="/products?deals=limited" className="bg-white/80 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-xl hover:bg-white transition-all duration-300 flex items-center space-x-2 border border-red-200 shadow-lg hover:shadow-xl">
              <span className="font-medium">View All Deals</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
                </div>

          {/* Deals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Deal 1 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
              <div className="text-center">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold mb-3 inline-block">
                    FLASH SALE
                </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Electronics</h3>
                  <p className="text-2xl font-bold text-red-600 mb-2">Up to 70% OFF</p>
                  <p className="text-sm text-gray-600 mb-4">Smartphones, Laptops & More</p>
                  <Link href="/categories/electronics?deal=flash" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                    Shop Now
                  </Link>
                  </div>
                </div>
              </div>
              
            {/* Deal 2 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-orange-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
              <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold mb-3 inline-block">
                    WEEKEND SPECIAL
              </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Fashion</h3>
                  <p className="text-2xl font-bold text-orange-600 mb-2">50% OFF</p>
                  <p className="text-sm text-gray-600 mb-4">Clothing & Accessories</p>
                  <Link href="/categories/fashion?deal=weekend" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                    Shop Now
                  </Link>
            </div>
          </div>
                </div>

            {/* Deal 3 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
              <div className="text-center">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold mb-3 inline-block">
                    SPRING SALE
                </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Home & Garden</h3>
                  <p className="text-2xl font-bold text-red-600 mb-2">40% OFF</p>
                  <p className="text-sm text-gray-600 mb-4">Furniture & Decor</p>
                  <Link href="/categories/home-garden?deal=spring" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                    Shop Now
                  </Link>
                  </div>
                </div>
              </div>
              
            {/* Deal 4 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-orange-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
              <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold mb-3 inline-block">
                    MEMBER EXCLUSIVE
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Beauty</h3>
                  <p className="text-2xl font-bold text-orange-600 mb-2">30% OFF</p>
                  <p className="text-sm text-gray-600 mb-4">Skincare & Makeup</p>
                  <Link href="/categories/beauty?deal=member" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products Section */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 rounded-lg p-2">
                <StarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                <p className="text-gray-600">Products you might love</p>
              </div>
            </div>
            <Link href="/products?sort=recommended" className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 border border-gray-200">
              <span>View All</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
          </div>

          {/* Products Grid */}
          <div className="relative">
            <div id="recommended-products-container" className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
              {loading ? (
                // Loading skeleton
                [...Array(15)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
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
                recommendedProducts.map((product) => {
                  const primaryImage = product.images?.[0];
                  const hasSalePrice = product.sale_price && product.sale_price < product.price;
                  const discountPercentage = hasSalePrice ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;
                  const displayPrice = hasSalePrice ? product.sale_price! : product.price;
                  const averageRating = product.reviews?.length ? 
                    product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 4.5;
                  const reviewCount = product.reviews?.length || 0;
                  
                  return (
                    <Link key={product.id} href={`/products/${product.slug}`} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                      <div className="relative">
                        {/* Product Image */}
                        <div className="w-full h-56 bg-gray-100 rounded-t-lg overflow-hidden">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.image_url}
                              alt={product.name}
                              width={256}
                              height={200}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col space-y-2">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Free Delivery
                          </span>
                        </div>
                        
                        {/* Heart Icon */}
                        <div className="absolute top-3 right-3">
                          <button 
                            onClick={(e) => handleToggleFavorite(product, e)}
                            className={`bg-white/80 hover:bg-white rounded-full p-2 transition-colors ${
                              isFavorite(product.id) ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <HeartIcon className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                          {product.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center space-x-1 mb-3">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} className={`h-3 w-3 ${i < Math.floor(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {averageRating.toFixed(1)} ({reviewCount})
                          </span>
                        </div>
                        
                        {/* Price and Add to Cart */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {hasSalePrice ? (
                              <>
                                <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                                <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={addingToCart === product.id}
                            className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingToCart === product.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <ShoppingBasketIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            
            {/* Left Scroll Arrow */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 translate-x-4">
              <button 
                onClick={() => {
                  const container = document.getElementById('recommended-products-container');
                  if (container) {
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
                className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* Right Scroll Arrow */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-4">
              <button 
                onClick={() => {
                  const container = document.getElementById('recommended-products-container');
                  if (container) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
                className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Best Selling Products Section */}
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 rounded-lg p-2">
                <ShoppingBagIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Best Selling Products</h2>
                <p className="text-gray-600">Most popular items this month</p>
              </div>
            </div>
            <Link href="/products?sort=bestselling" className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 border border-gray-200">
              <span>View All</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Products Grid */}
          <div className="relative">
            <div id="bestselling-products-container" className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
              {loading ? (
                // Loading skeleton
                [...Array(15)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
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
                bestSellingProducts.map((product) => {
                  const primaryImage = product.images?.[0];
                  const hasSalePrice = product.sale_price && product.sale_price < product.price;
                  const discountPercentage = hasSalePrice ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;
                  const displayPrice = hasSalePrice ? product.sale_price! : product.price;
                  const averageRating = product.reviews?.length ? 
                    product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 4.5;
                  const reviewCount = product.reviews?.length || 0;
                  
                  return (
                    <Link key={product.id} href={`/products/${product.slug}`} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                      <div className="relative">
                        {/* Product Image */}
                        <div className="w-full h-56 bg-gray-100 rounded-t-lg overflow-hidden">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.image_url}
                              alt={product.name}
                              width={256}
                              height={200}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col space-y-2">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Free Delivery
                          </span>
                        </div>
                        
                        {/* Heart Icon */}
                        <div className="absolute top-3 right-3">
                          <button 
                            onClick={(e) => handleToggleFavorite(product, e)}
                            className={`bg-white/80 hover:bg-white rounded-full p-2 transition-colors ${
                              isFavorite(product.id) ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <HeartIcon className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                          {product.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center space-x-1 mb-3">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} className={`h-3 w-3 ${i < Math.floor(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {averageRating.toFixed(1)} ({reviewCount})
                          </span>
                        </div>
                        
                        {/* Price and Add to Cart */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {hasSalePrice ? (
                              <>
                                <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                                <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={addingToCart === product.id}
                            className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingToCart === product.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <ShoppingBasketIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            
            {/* Left Scroll Arrow */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 translate-x-4">
              <button 
                onClick={() => {
                  const container = document.getElementById('bestselling-products-container');
                  if (container) {
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
                className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* Right Scroll Arrow */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-4">
              <button 
                onClick={() => {
                  const container = document.getElementById('bestselling-products-container');
                  if (container) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
                className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending in Home and Living Section */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 rounded-lg p-2">
                <HomeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Trending in Home & Living</h2>
                <p className="text-gray-600">Transform your space with trending home essentials</p>
              </div>
            </div>
            <Link href="/categories/home-garden?sort=trending" className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 border border-gray-200">
              <span>View All</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Products Grid */}
          <div className="relative">
            <div id="home-living-products-container" className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
              {loading ? (
                // Loading skeleton
                [...Array(12)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
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
                homeLivingProducts.map((product) => {
                  const primaryImage = product.images?.[0];
                  const hasSalePrice = product.sale_price && product.sale_price < product.price;
                  const discountPercentage = hasSalePrice ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;
                  const displayPrice = hasSalePrice ? product.sale_price! : product.price;
                  const averageRating = product.reviews?.length ? 
                    product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 4.5;
                  const reviewCount = product.reviews?.length || 0;
                  
                  return (
                    <Link key={product.id} href={`/products/${product.slug}`} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                      <div className="relative">
                        {/* Product Image */}
                        <div className="w-full h-56 bg-gray-100 rounded-t-lg overflow-hidden">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.image_url}
                              alt={product.name}
                              width={256}
                              height={200}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col space-y-2">
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Trending
                          </span>
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Free Delivery
                          </span>
                        </div>
                        
                        {/* Heart Icon */}
                        <div className="absolute top-3 right-3">
                          <button 
                            onClick={(e) => handleToggleFavorite(product, e)}
                            className={`bg-white/80 hover:bg-white rounded-full p-2 transition-colors ${
                              isFavorite(product.id) ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <HeartIcon className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                          {product.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center space-x-1 mb-3">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} className={`h-3 w-3 ${i < Math.floor(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {averageRating.toFixed(1)} ({reviewCount})
                          </span>
                        </div>
                        
                        {/* Price and Add to Cart */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {hasSalePrice ? (
                              <>
                                <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                                <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={addingToCart === product.id}
                            className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingToCart === product.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <ShoppingBasketIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            
            {/* Left Scroll Arrow */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 translate-x-4">
              <button 
                onClick={() => {
                  const container = document.getElementById('home-living-products-container');
                  if (container) {
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
                className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* Right Scroll Arrow */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-4">
              <button 
                onClick={() => {
                  const container = document.getElementById('home-living-products-container');
                  if (container) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
                className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Carousel Section */}
      <section className="py-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Carousel Container */}
            <div className="relative h-56 rounded-lg overflow-hidden">
              {/* Slides */}
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {heroSlides.map((slide) => (
                  <Link
                    key={slide.id}
                    href={slide.href}
                    className="w-full flex-shrink-0 relative"
                  >
                    <div className="h-full relative group cursor-pointer overflow-hidden">
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      />
                    </div>
                  </Link>
                ))}
          </div>
          
              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
                  </div>
            
            {/* Dots Indicator */}
            <div className="flex justify-center mt-4 space-x-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-orange-500 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
              allProducts.map((product) => {
                const primaryImage = product.images?.[0];
                const hasSalePrice = product.sale_price && product.sale_price < product.price;
                const displayPrice = hasSalePrice ? product.sale_price! : product.price;
                const averageRating = product.reviews?.length ? 
                  product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 4.5;
                const reviewCount = product.reviews?.length || 0;
                
                return (
                  <Link key={product.id} href={`/products/${product.slug}`} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                    <div className="relative">
                      {/* Product Image */}
                      <div className="w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.image_url}
                            alt={product.name}
                            width={256}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-2">
                        {hasSalePrice && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Sale
                          </span>
                        )}
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Free Delivery
                        </span>
                      </div>
                      
                      {/* Heart Icon */}
                      <div className="absolute top-3 right-3">
                        <button 
                          onClick={(e) => handleToggleFavorite(product, e)}
                          className={`bg-white/80 hover:bg-white rounded-full p-2 transition-colors ${
                            isFavorite(product.id) ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                          }`}
                        >
                          <HeartIcon className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {product.name}
                      </h3>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-1 mb-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className={`h-3 w-3 ${i < Math.floor(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {averageRating.toFixed(1)} ({reviewCount})
                        </span>
                      </div>
                      
                      {/* Price and Add to Cart */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {hasSalePrice ? (
                            <>
                              <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                              <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={addingToCart === product.id}
                          className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingToCart === product.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <ShoppingBasketIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          
          {/* Loading More Products */}
          {loadingMore && (
            <div className="flex justify-center mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
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


