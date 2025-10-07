'use client';

import { useState, useEffect } from 'react';
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
          language_code
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

  const handleMediaClick = (media: PromotionalMedia) => {
    if (media.media_type === 'popup') {
      setShowPopup(media);
    } else if (media.link_url) {
      if (media.target === '_blank') {
        window.open(media.link_url, '_blank');
      } else {
        window.location.href = media.link_url;
      }
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const getImageUrl = (media: PromotionalMedia) => {
    // Use mobile image on smaller screens, desktop image on larger screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return media.mobile_image_url || media.image_url;
    }
    return media.image_url || media.mobile_image_url;
  };

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
    const imageUrl = getImageUrl(media);

    console.log(`🎨 Rendering media item ${index + 1}:`, {
      title: media.title,
      hasImage: !!imageUrl,
      imageUrl: imageUrl,
      mediaType: media.media_type,
      isActive: isActive
    });

    return (
      <div
        key={media.id}
        className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
          isActive ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        style={{
          backgroundColor: media.background_color,
          color: media.text_color
        }}
      >
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={media.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
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
            
            {/* Content Overlay for image-based media */}
            {(media.title || media.subtitle || media.description || media.button_text) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                <div className="p-4 w-full">
                  {media.title && (
                    <h3 className="text-xl font-bold mb-2">{media.title}</h3>
                  )}
                  {media.subtitle && (
                    <h4 className="text-lg font-semibold mb-2">{media.subtitle}</h4>
                  )}
                  {media.description && (
                    <p className="text-sm mb-3 line-clamp-2">{media.description}</p>
                  )}
                  {media.button_text && (
                    <button
                      onClick={() => handleMediaClick(media)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      {media.button_text}
                      {media.target === '_blank' && <ExternalLink className="w-4 h-4" />}
                    </button>
                  )}
                </div>
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

  // Single banner or other media types
  return (
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
              
              {renderMediaItem(showPopup, 0)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

