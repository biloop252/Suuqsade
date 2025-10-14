'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia } from '@/types/database';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';

interface HomepageMiddleSliderProps {
  className?: string;
  maxSlides?: number;
}

export default function HomepageMiddleSlider({ className = '', maxSlides = 5 }: HomepageMiddleSliderProps) {
  const [slides, setSlides] = useState<PromotionalMedia[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
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
          created_at,
          updated_at
        `)
        .eq('banner_position', 'homepage_middle_slider')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true })
        .limit(maxSlides);

      if (error) {
        console.error('Error fetching homepage middle slider:', error);
        return;
      }

      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching homepage middle slider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideClick = (slide: PromotionalMedia) => {
    if (slide.link_url) {
      if (slide.target === '_blank') {
        window.open(slide.link_url, '_blank');
      } else {
        window.location.href = slide.link_url;
      }
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

  return (
    <section className={`py-4 bg-white relative overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Carousel Container */}
          <div className="relative h-56 rounded-lg overflow-hidden">
            {/* Slides */}
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="w-full flex-shrink-0 relative cursor-pointer"
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
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
              </>
            )}
          </div>
          
          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {slides.map((_, index) => (
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
          )}
        </div>
      </div>
    </section>
  );
}
