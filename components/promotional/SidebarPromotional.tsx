'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia } from '@/types/database';
import { ExternalLink } from 'lucide-react';

interface SidebarPromotionalProps {
  className?: string;
  maxItems?: number;
}

export default function SidebarPromotional({ 
  className = '', 
  maxItems = 3 
}: SidebarPromotionalProps) {
  const [mediaItems, setMediaItems] = useState<PromotionalMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSidebarMedia();
  }, []);

  const fetchSidebarMedia = async () => {
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
          background_color,
          text_color
        `)
        .eq('banner_position', 'sidebar')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true })
        .limit(maxItems);

      if (error) {
        console.error('Error fetching sidebar media:', error);
        return;
      }

      setMediaItems(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = (media: PromotionalMedia) => {
    if (media.link_url) {
      if (media.target === '_blank') {
        window.open(media.link_url, '_blank');
      } else {
        window.location.href = media.link_url;
      }
    }
  };

  const getImageUrl = (media: PromotionalMedia) => {
    // For sidebar, prefer mobile images as they're usually smaller
    return media.mobile_image_url || media.image_url;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(maxItems)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {mediaItems.map((media) => {
        const imageUrl = getImageUrl(media);
        
        return (
          <div
            key={media.id}
            onClick={() => handleMediaClick(media)}
            className="relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg cursor-pointer"
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
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                
                {/* Content Overlay */}
                {(media.title || media.subtitle || media.button_text) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-3 w-full">
                      {media.title && (
                        <h4 className="text-sm font-bold mb-1 line-clamp-1">{media.title}</h4>
                      )}
                      {media.subtitle && (
                        <h5 className="text-xs font-semibold mb-1 line-clamp-1">{media.subtitle}</h5>
                      )}
                      {media.button_text && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMediaClick(media);
                          }}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          {media.button_text}
                          {media.target === '_blank' && <ExternalLink className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text-only sidebar item */
              <div className="p-3">
                {media.title && (
                  <h4 className="text-sm font-bold mb-2 line-clamp-2">{media.title}</h4>
                )}
                {media.subtitle && (
                  <h5 className="text-xs font-semibold mb-2 line-clamp-1">{media.subtitle}</h5>
                )}
                {media.description && (
                  <p className="text-xs mb-2 line-clamp-2">{media.description}</p>
                )}
                {media.button_text && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMediaClick(media);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    {media.button_text}
                    {media.target === '_blank' && <ExternalLink className="w-3 h-3" />}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

