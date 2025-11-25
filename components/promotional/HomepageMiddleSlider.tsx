'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia } from '@/types/database';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';

interface HomepageMiddleSliderProps {
  className?: string;
  maxSlides?: number;
}

export default function HomepageMiddleSlider({ className = '', maxSlides = 5 }: HomepageMiddleSliderProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<PromotionalMedia[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (slides.length <= 1) {
      setCurrentSlide(0);
      return;
    }

    console.log('HomepageMiddleSlider: Setting up auto-slide for', slides.length, 'slides');
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slides.length;
        console.log('HomepageMiddleSlider: Auto-sliding from', prev, 'to', next);
        return next;
      });
    }, 4000); // Change slide every 4 seconds

    return () => {
      console.log('HomepageMiddleSlider: Cleaning up auto-slide interval');
      clearInterval(interval);
    };
  }, [slides.length]);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      const nowDate = new Date(now);
      
      // First, fetch promotional_media records for homepage_middle_slider
      const { data: promotionalMedia, error: pmError } = await supabase
        .from('promotional_media')
        .select(`
          id,
          title,
          subtitle,
          description,
          media_type,
          image_url,
          mobile_image_url,
          link_url,
          button_text,
          target,
          banner_position,
          display_order,
          background_color,
          text_color,
          is_active,
          start_date,
          end_date,
          language_code,
          action_type,
          action_params,
          created_at,
          updated_at
        `)
        .eq('banner_position', 'homepage_middle_slider')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(maxSlides);

      if (pmError) {
        console.error('Error fetching homepage middle slider:', pmError);
        return;
      }

      console.log('HomepageMiddleSlider: Raw promotional_media from DB:', promotionalMedia?.length || 0, 'records');
      
      if (!promotionalMedia || promotionalMedia.length === 0) {
        setSlides([]);
        return;
      }

      // Filter by date range
      const validPromotionalMedia = promotionalMedia.filter(pm => {
        const startDate = pm.start_date ? new Date(pm.start_date) : null;
        const endDate = pm.end_date ? new Date(pm.end_date) : null;
        const isStartValid = !startDate || startDate <= nowDate;
        const isEndValid = !endDate || endDate >= nowDate;
        return isStartValid && isEndValid;
      });

      // Check if any promotional_media has slider_items
      const promotionalMediaIds = validPromotionalMedia.map(pm => pm.id);
      
      const { data: sliderItems, error: siError } = await supabase
        .from('slider_items')
        .select('*')
        .in('promotional_media_id', promotionalMediaIds)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (siError) {
        console.error('Error fetching slider items:', siError);
      }

      console.log('HomepageMiddleSlider: Found', sliderItems?.length || 0, 'slider_items');

      let finalSlides: PromotionalMedia[] = [];

      // If slider_items exist, use them (convert to PromotionalMedia format)
      if (sliderItems && sliderItems.length > 0) {
        // Get the parent promotional_media for each slider_item
        const parentMediaMap = new Map(validPromotionalMedia.map(pm => [pm.id, pm]));
        
        finalSlides = sliderItems.map(item => {
          const parent = parentMediaMap.get(item.promotional_media_id);
          return {
            ...parent!,
            id: item.id, // Use slider_item id
            image_url: item.image_url,
            mobile_image_url: item.mobile_image_url || parent?.mobile_image_url,
            link_url: item.link_url || parent?.link_url,
            button_text: item.button_text || parent?.button_text,
            target: item.target || parent?.target,
            display_order: item.display_order,
            action_type: item.action_type || parent?.action_type,
            action_params: item.action_params || parent?.action_params,
          } as PromotionalMedia;
        });
      } else {
        // No slider_items, use promotional_media records directly
        finalSlides = validPromotionalMedia;
      }

      console.log('HomepageMiddleSlider: Final slides count:', finalSlides.length);
      console.log('HomepageMiddleSlider: Final slides:', finalSlides.map(s => ({ 
        id: s.id, 
        title: s.title, 
        image_url: s.image_url ? 'has image' : 'no image',
        display_order: s.display_order
      })));
      
      setSlides(finalSlides);
      setCurrentSlide(0); // Reset to first slide when slides change
    } catch (error) {
      console.error('Error fetching homepage middle slider:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildActionUrl = (slide: PromotionalMedia): string | null => {
    // If no action_type, fall back to link_url
    if (!slide?.action_type) {
      return slide?.link_url || null;
    }

    // Parse action_params if it's a string (shouldn't happen with Supabase but just in case)
    let params: Record<string, any> = {};
    if (slide?.action_params) {
      if (typeof slide.action_params === 'string') {
        try {
          params = JSON.parse(slide.action_params);
        } catch (e) {
          console.error('Error parsing action_params:', e);
          return slide?.link_url || null;
        }
      } else if (typeof slide.action_params === 'object' && slide.action_params !== null) {
        params = slide.action_params;
      }
    }

    // Check if params is empty object
    const hasParams = Object.keys(params).length > 0;

    // If action_type requires params but params are empty, fall back to link_url
    const actionTypesRequiringParams = ['open_category', 'open_product', 'open_brand', 'open_url', 'open_filtered_products'];
    if (actionTypesRequiringParams.includes(slide.action_type) && !hasParams) {
      return slide?.link_url || null;
    }

    let url: string | null = null;

    switch (slide.action_type) {
      case 'open_category':
        if (params.categoryId !== undefined && params.categoryId !== null && params.categoryId !== '') {
          url = `/categories/${params.categoryId}`;
        }
        break;

      case 'open_product':
        if (params.productId !== undefined && params.productId !== null && params.productId !== '') {
          url = `/products/${params.productId}`;
        }
        break;

      case 'open_brand':
        if (params.brand !== undefined && params.brand !== null && params.brand !== '') {
          url = `/brands/${params.brand}`;
        }
        break;

      case 'open_flash_sale':
        url = '/products?flashSale=true';
        break;

      case 'open_filtered_products': {
        const queryParams = new URLSearchParams();
        
        if (params.categoryId) queryParams.set('categoryId', params.categoryId);
        if (params.brand) queryParams.set('brand', params.brand);
        if (params.vendorId) queryParams.set('vendor', params.vendorId);
        if (params.minPrice) queryParams.set('minPrice', params.minPrice);
        if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice);
        if (params.discountMin) queryParams.set('discountMin', params.discountMin);
        if (params.flashSale) queryParams.set('flashSale', 'true');
        if (params.color) queryParams.set('color', params.color);
        if (params.size) queryParams.set('size', params.size);

        url = `/products?${queryParams.toString()}`;
        break;
      }

      case 'open_url':
        if (params.url !== undefined && params.url !== null && params.url !== '') {
          url = params.url;
        }
        break;
    }

    return url || slide?.link_url || null;
  };

  const handleSlideClick = (slide: PromotionalMedia) => {
    const url = buildActionUrl(slide);
    
    if (!url) return;

    // Check if it's an external URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (slide.target === '_blank') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    } else {
      // Internal navigation
      router.push(url);
    }
  };

  if (loading) {
    return (
      <section className={`py-4 bg-white relative overflow-hidden ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="animate-pulse bg-gray-200 rounded-lg h-56"></div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null; // Don't render the section if no slides are available
  }

  console.log('HomepageMiddleSlider: Rendering with', slides.length, 'slides, currentSlide:', currentSlide);

  return (
    <section className={`py-4 bg-white relative overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Carousel Container */}
          <div className="relative h-56 w-full rounded-lg overflow-hidden">
            {/* Slides */}
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ 
                transform: `translateX(-${currentSlide * (100 / slides.length)}%)`,
                width: `${slides.length * 100}%`
              }}
            >
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="relative cursor-pointer"
                  style={{ width: `${100 / slides.length}%`, flexShrink: 0 }}
                  onClick={() => handleSlideClick(slide)}
                >
                  <div className="h-full group cursor-pointer overflow-hidden">
                    {slide.image_url ? (
                      /* Show only image when image is present */
                      <div 
                        className="h-full bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${slide.image_url})` }}
                      />
                    ) : (
                      /* Show only text content when no image */
                      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
                        <div className="text-center">
                          {slide.subtitle && (
                            <div className="text-sm font-medium mb-2 text-gray-600">
                              {slide.subtitle}
                            </div>
                          )}
                          {slide.title && (
                            <h3 className="text-2xl font-bold mb-2 text-gray-900">
                              {slide.title}
                            </h3>
                          )}
                          {slide.description && (
                            <p className="text-lg mb-4 text-gray-600">
                              {slide.description}
                            </p>
                          )}
                          {slide.button_text && (
                            <div className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                              {slide.button_text}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 z-10"
                  aria-label="Previous slide"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-800" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide((prev) => (prev + 1) % slides.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 z-10"
                  aria-label="Next slide"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-800" />
                </button>
              </>
            )}
          </div>
          
          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="flex justify-center mt-2 space-x-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-primary-500' 
                      : 'bg-gray-300 hover:bg-primary-300'
                  }`}
                  style={{ 
                    width: '10px', 
                    height: '10px', 
                    minWidth: '10px', 
                    minHeight: '10px',
                    padding: 0
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
