'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SliderItem {
  id: string;
  promotional_media_id: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  button_text: string;
  target: '_self' | '_blank' | '_parent' | '_top';
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromotionalSliderProps {
  promotionalMediaId: string;
  className?: string;
}

export default function PromotionalSlider({ promotionalMediaId, className = '' }: PromotionalSliderProps) {
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSliderItems();
  }, [promotionalMediaId]);

  const fetchSliderItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('slider_items')
        .select('*')
        .eq('promotional_media_id', promotionalMediaId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSliderItems(data || []);
    } catch (err: any) {
      console.error('Error fetching slider items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderItems.length) % sliderItems.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleSlideClick = (item: SliderItem) => {
    if (item.link_url) {
      if (item.target === '_blank') {
        window.open(item.link_url, '_blank');
      } else {
        window.location.href = item.link_url;
      }
    }
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (sliderItems.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderItems.length]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-gray-500">Loading slider...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-red-50 rounded-lg ${className}`}>
        <div className="text-red-500">Error loading slider: {error}</div>
      </div>
    );
  }

  if (sliderItems.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-gray-500">No slider items found</div>
      </div>
    );
  }

  const currentItem = sliderItems[currentSlide];

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Main Slider Container */}
      <div className="relative h-64 md:h-80 lg:h-96">
        {/* Desktop Image */}
        <div className="hidden md:block">
          <img
            src={currentItem.image_url}
            alt={`Slider ${currentSlide + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handleSlideClick(currentItem)}
          />
        </div>

        {/* Mobile Image */}
        <div className="block md:hidden">
          <img
            src={currentItem.mobile_image_url || currentItem.image_url}
            alt={`Slider ${currentSlide + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handleSlideClick(currentItem)}
          />
        </div>

        {/* Overlay Content */}
        {currentItem.button_text && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 text-white px-6 py-3 rounded-lg">
              <button
                onClick={() => handleSlideClick(currentItem)}
                className="text-lg font-semibold hover:text-orange-300 transition-colors"
              >
                {currentItem.button_text}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {sliderItems.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators */}
      {sliderItems.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {sliderItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-orange-500'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {sliderItems.length > 1 && (
        <div className="text-center mt-2 text-sm text-gray-600">
          {currentSlide + 1} of {sliderItems.length}
        </div>
      )}
    </div>
  );
}
