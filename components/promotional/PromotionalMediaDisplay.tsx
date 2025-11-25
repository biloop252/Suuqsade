'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia, PromotionalMediaPosition } from '@/types/database';
import { ChevronLeft, ChevronRight, X, Play, ExternalLink } from 'lucide-react';
import PromotionalSlider from './PromotionalSlider';

interface PromotionalMediaDisplayProps {
  position: PromotionalMediaPosition;
  className?: string;
  maxItems?: number;
}

export default function PromotionalMediaDisplay({ 
  position, 
  className = '', 
  maxItems = 5 
}: PromotionalMediaDisplayProps) {
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<PromotionalMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPopup, setShowPopup] = useState<PromotionalMedia | null>(null);

  useEffect(() => {
    fetchPromotionalMedia();
  }, [position]);

  const fetchPromotionalMedia = async () => {
    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      
      console.log('🔍 PromotionalMediaDisplay: Fetching for position:', position);
      
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
          video_url,
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
        .eq('banner_position', position)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true })
        .limit(maxItems);

      if (error) {
        console.error('❌ PromotionalMediaDisplay: Error fetching promotional media:', error);
        return;
      }

      console.log('✅ PromotionalMediaDisplay: Fetched data:', data);
      console.log('📊 PromotionalMediaDisplay: Items count:', data?.length || 0);
      
      setMediaItems(data || []);
    } catch (error) {
      console.error('❌ PromotionalMediaDisplay: Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildActionUrl = (media: PromotionalMedia): string | null => {
    console.log('🔧 buildActionUrl called:', {
      mediaId: media.id,
      action_type: media?.action_type,
      action_params: media?.action_params,
      link_url: media?.link_url
    });

    // If no action_type, fall back to link_url
    if (!media?.action_type) {
      console.log('⚠️ No action_type, using link_url:', media?.link_url);
      return media?.link_url || null;
    }

    // Parse action_params if it's a string (shouldn't happen with Supabase but just in case)
    let params: Record<string, any> = {};
    if (media?.action_params) {
      if (typeof media.action_params === 'string') {
        try {
          params = JSON.parse(media.action_params);
          console.log('📝 Parsed action_params from string:', params);
        } catch (e) {
          console.error('❌ Error parsing action_params:', e);
          return media?.link_url || null;
        }
      } else if (typeof media.action_params === 'object' && media.action_params !== null) {
        params = media.action_params;
        console.log('📝 Using action_params as object:', params);
      }
    } else {
      console.log('⚠️ No action_params provided');
    }

    // Check if params is empty object
    const hasParams = Object.keys(params).length > 0;
    console.log('📋 Has params:', hasParams, 'Params:', params);

    // If action_type requires params but params are empty, fall back to link_url
    const actionTypesRequiringParams = ['open_category', 'open_product', 'open_brand', 'open_url', 'open_filtered_products'];
    if (actionTypesRequiringParams.includes(media.action_type) && !hasParams) {
      console.log('⚠️ Action type requires params but params are empty, falling back to link_url');
      return media?.link_url || null;
    }

    let url: string | null = null;

    switch (media.action_type) {
      case 'open_category':
        if (params.categoryId !== undefined && params.categoryId !== null && params.categoryId !== '') {
          url = `/categories/${params.categoryId}`;
          console.log('✅ Built category URL:', url);
        } else {
          console.log('⚠️ Category ID missing in params');
        }
        break;

      case 'open_product':
        if (params.productId !== undefined && params.productId !== null && params.productId !== '') {
          url = `/products/${params.productId}`;
          console.log('✅ Built product URL:', url);
        } else {
          console.log('⚠️ Product ID missing in params');
        }
        break;

      case 'open_brand':
        if (params.brand !== undefined && params.brand !== null && params.brand !== '') {
          url = `/brands/${params.brand}`;
          console.log('✅ Built brand URL:', url);
        } else {
          console.log('⚠️ Brand missing in params');
        }
        break;

      case 'open_flash_sale':
        url = '/products?flashSale=true';
        console.log('✅ Built flash sale URL:', url);
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
        console.log('✅ Built filtered products URL:', url);
        break;
      }

      case 'open_url':
        if (params.url !== undefined && params.url !== null && params.url !== '') {
          url = params.url;
          console.log('✅ Built custom URL:', url);
        } else {
          console.log('⚠️ URL missing in params');
        }
        break;

      default:
        console.log('⚠️ Unknown action_type:', media.action_type);
    }

    const finalUrl = url || media?.link_url || null;
    console.log('🔗 Final URL:', finalUrl);
    return finalUrl;
  };

  const handleMediaClick = (media: PromotionalMedia, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    console.log('🖱️ handleMediaClick called:', {
      mediaId: media.id,
      title: media.title,
      action_type: media.action_type,
      action_params: media.action_params,
      link_url: media.link_url
    });

    if (media.media_type === 'popup') {
      console.log('📋 Opening popup for media:', media.id);
      setShowPopup(media);
      return;
    }

    const url = buildActionUrl(media);
    console.log('🔗 Built action URL:', url);
    
    if (!url) {
      console.log('⚠️ No URL to navigate to');
      return;
    }

    // Check if it's an external URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('🌐 External URL, opening:', url);
      if (media.target === '_blank') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    } else {
      // Internal navigation
      console.log('🔀 Internal navigation to:', url);
      router.push(url);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  // Use responsive <picture> in render instead of window checks

  if (loading) {
    console.log('🔄 PromotionalMediaDisplay: Loading state');
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-32 ${className}`}></div>
    );
  }

  if (mediaItems.length === 0) {
    console.log('❌ PromotionalMediaDisplay: No media items found for position:', position);
    return null;
  }

  console.log('✅ PromotionalMediaDisplay: Rendering', mediaItems.length, 'items for position:', position);

  // Render different components based on media type
  const renderMediaItem = (media: PromotionalMedia, index: number) => {
    const isActive = index === currentSlide;
    // image URLs
    const desktopImage = media.image_url || media.mobile_image_url || '';
    const mobileImage = media.mobile_image_url || media.image_url || '';

    console.log(`🎨 Rendering media item ${index + 1}:`, {
      title: media.title,
      hasImage: !!(desktopImage || mobileImage),
      desktopImage,
      mobileImage,
      mediaType: media.media_type,
      isActive: isActive
    });

    return (
      <div
        key={media.id}
        className={`relative overflow-hidden rounded-lg transition-all duration-300 w-full h-full ${
          isActive ? 'opacity-100 z-10' : 'opacity-0 absolute inset-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: media.background_color,
          color: media.text_color
        }}
        onClick={(e) => {
          console.log('🖱️ Slide clicked, isActive:', isActive, 'mediaId:', media.id);
          if (isActive) {
            handleMediaClick(media, e);
          } else {
            console.log('⚠️ Click ignored - slide is not active');
          }
        }}
      >
        {desktopImage || mobileImage ? (
          <div className="flex flex-col">
            {/* Image Container */}
            <div 
              className="relative cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) {
                  handleMediaClick(media, e);
                }
              }}
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={mobileImage} />
                <img
                  src={desktopImage}
                  alt={media.title || 'Promotional banner'}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) {
                      handleMediaClick(media, e);
                    }
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </picture>
              {media.video_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => window.open(media.video_url, '_blank')}
                    className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <Play className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Content Below Image */}
            {(media.title || media.subtitle || media.description || media.button_text) && (
              <div className="p-4 bg-white">
                {media.title && (
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{media.title}</h3>
                )}
                {media.subtitle && (
                  <h4 className="text-lg font-semibold mb-2 text-gray-700">{media.subtitle}</h4>
                )}
                {media.description && (
                  <p className="text-sm mb-3 line-clamp-2 text-gray-600">{media.description}</p>
                )}
                {media.button_text && (
                  <button
                    onClick={() => handleMediaClick(media)}
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    {media.button_text}
                    {media.target === '_blank' && <ExternalLink className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Text-only content when no image */
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              {media.title && (
                <h3 className="text-2xl font-bold mb-3">{media.title}</h3>
              )}
              {media.subtitle && (
                <h4 className="text-xl font-semibold mb-3">{media.subtitle}</h4>
              )}
              {media.description && (
                <p className="text-lg mb-4">{media.description}</p>
              )}
              {media.button_text && (
                <button
                  onClick={() => handleMediaClick(media)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  {media.button_text}
                  {media.target === '_blank' && <ExternalLink className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render based on media type
  if (mediaItems[0]?.media_type === 'slider') {
    // Use the new PromotionalSlider component for slider types
    return (
      <div className={className}>
        {mediaItems.map((media) => (
          <PromotionalSlider
            key={media.id}
            promotionalMediaId={media.id}
            className="w-full"
          />
        ))}
      </div>
    );
  }

  // Single banner or carousel for other media types
  // If multiple items, render as carousel; otherwise render single item
  if (mediaItems.length > 1) {
    // Carousel mode with navigation
    return (
      <div className={`relative ${className}`}>
        <div className="relative overflow-hidden rounded-lg w-full h-full">
          {mediaItems.map((media, index) => renderMediaItem(media, index))}
        </div>
        
        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </>
        )}
        
        {/* Dots Indicator */}
        {mediaItems.length > 1 && (
          <div className="flex justify-center mt-2 space-x-2 z-20 relative">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-primary-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single banner
  return (
    <div className={className}>
      {mediaItems.map((media, index) => (
        <div
          key={media.id}
          onClick={(e) => handleMediaClick(media, e)}
          className="cursor-pointer"
        >
          {renderMediaItem(media, index)}
        </div>
      ))}
    </div>
  );

  // Popup Modal
  return (
    <>
      <div className={className}>
        {mediaItems.map((media, index) => (
          <div
            key={media.id}
            onClick={() => handleMediaClick(media)}
            className="cursor-pointer"
          >
            {renderMediaItem(media, index)}
          </div>
        ))}
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setShowPopup(null)}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
              >
                <X className="w-5 h-5" />
              </button>
              
              {showPopup && renderMediaItem(showPopup!, 0)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

