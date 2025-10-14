'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia, PromotionalMediaPosition } from '@/types/database';
import { ExternalLink } from 'lucide-react';

interface PromotionalBannerProps {
  position: PromotionalMediaPosition;
  className?: string;
  showTitle?: boolean;
  showDescription?: boolean;
}

export default function PromotionalBanner({ 
  position, 
  className = '', 
  showTitle = true,
  showDescription = true 
}: PromotionalBannerProps) {
  const [banner, setBanner] = useState<PromotionalMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanner();
  }, [position]);

  const fetchBanner = async () => {
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
          language_code,
          created_at,
          updated_at
        `)
        .eq('banner_position', position)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Error fetching banner:', error);
        return;
      }

      // Handle the case when no data is returned
      setBanner(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = () => {
    if (banner?.link_url) {
      if (banner.target === '_blank') {
        window.open(banner.link_url, '_blank');
      } else {
        window.location.href = banner.link_url;
      }
    }
  };

  const getImageUrl = () => {
    if (!banner) return null;
    
    // Use mobile image on smaller screens, desktop image on larger screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return banner.mobile_image_url || banner.image_url;
    }
    return banner.image_url || banner.mobile_image_url;
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-24 ${className}`}></div>
    );
  }

  if (!banner) {
    return null;
  }

  const imageUrl = getImageUrl();

  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg ${className}`}
      style={{
        backgroundColor: banner.background_color,
        color: banner.text_color
      }}
    >
      {imageUrl ? (
        <div className="flex flex-col">
          {/* Image Container */}
          <div className="relative">
            <img
              src={imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Content Below Image */}
          {(showTitle || showDescription) && (banner.title || banner.subtitle || banner.description || banner.button_text) && (
            <div className="p-3 bg-white">
              {showTitle && banner.title && (
                <h3 className="text-lg font-bold mb-1 text-gray-900">{banner.title}</h3>
              )}
              {banner.subtitle && (
                <h4 className="text-md font-semibold mb-1 text-gray-700">{banner.subtitle}</h4>
              )}
              {showDescription && banner.description && (
                <p className="text-sm mb-2 line-clamp-2 text-gray-600">{banner.description}</p>
              )}
              {banner.button_text && (
                <button
                  onClick={handleBannerClick}
                  className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 transition-colors flex items-center gap-1"
                >
                  {banner.button_text}
                  {banner.target === '_blank' && <ExternalLink className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Text-only banner */
        <div className="p-4 text-center">
          {showTitle && banner.title && (
            <h3 className="text-lg font-bold mb-2">{banner.title}</h3>
          )}
          {banner.subtitle && (
            <h4 className="text-md font-semibold mb-2">{banner.subtitle}</h4>
          )}
          {showDescription && banner.description && (
            <p className="text-sm mb-3">{banner.description}</p>
          )}
          {banner.button_text && (
            <button
              onClick={handleBannerClick}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              {banner.button_text}
              {banner.target === '_blank' && <ExternalLink className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

