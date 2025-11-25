'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
        .limit(1);

      if (error) {
        console.error('Error fetching banner:', error);
        return;
      }

      // Handle the case when no data is returned
      const bannerData = data && data.length > 0 ? data[0] : null;
      console.log('📦 Banner data fetched:', {
        id: bannerData?.id,
        title: bannerData?.title,
        action_type: bannerData?.action_type,
        action_params: bannerData?.action_params,
        action_params_type: typeof bannerData?.action_params,
        link_url: bannerData?.link_url
      });
      setBanner(bannerData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildActionUrl = (): string | null => {
    console.log('🔍 Building action URL for banner:', {
      action_type: banner?.action_type,
      action_params: banner?.action_params,
      action_params_type: typeof banner?.action_params,
      link_url: banner?.link_url
    });

    // If no action_type, fall back to link_url
    if (!banner?.action_type) {
      console.log('⚠️ No action_type, using link_url:', banner?.link_url);
      return banner?.link_url || null;
    }

    // Parse action_params if it's a string (shouldn't happen with Supabase but just in case)
    let params: Record<string, any> = {};
    if (banner?.action_params) {
      if (typeof banner.action_params === 'string') {
        try {
          params = JSON.parse(banner.action_params);
        } catch (e) {
          console.error('❌ Error parsing action_params:', e);
          return banner?.link_url || null;
        }
      } else if (typeof banner.action_params === 'object' && banner.action_params !== null) {
        params = banner.action_params;
      }
    }

    // Check if params is empty object
    const hasParams = Object.keys(params).length > 0;
    console.log('📋 Parsed params:', params, 'Has params:', hasParams);

    // If action_type requires params but params are empty, fall back to link_url
    const actionTypesRequiringParams = ['open_category', 'open_product', 'open_brand', 'open_url', 'open_filtered_products'];
    if (actionTypesRequiringParams.includes(banner.action_type) && !hasParams) {
      console.log('⚠️ Action type requires params but params are empty, falling back to link_url');
      return banner?.link_url || null;
    }
    let url: string | null = null;

    switch (banner.action_type) {
      case 'open_category':
        if (params.categoryId !== undefined && params.categoryId !== null && params.categoryId !== '') {
          url = `/categories/${params.categoryId}`;
          console.log('✅ Open category URL:', url);
        } else {
          console.log('⚠️ Category ID missing in params:', params);
        }
        break;

      case 'open_product':
        if (params.productId !== undefined && params.productId !== null && params.productId !== '') {
          url = `/products/${params.productId}`;
          console.log('✅ Open product URL:', url);
        } else {
          console.log('⚠️ Product ID missing in params:', params);
        }
        break;

      case 'open_brand':
        if (params.brand !== undefined && params.brand !== null && params.brand !== '') {
          url = `/brands/${params.brand}`;
          console.log('✅ Open brand URL:', url);
        } else {
          console.log('⚠️ Brand missing in params:', params);
        }
        break;

      case 'open_flash_sale':
        url = '/products?flashSale=true';
        console.log('✅ Open flash sale URL:', url);
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
        console.log('✅ Open filtered products URL:', url);
        break;
      }

      case 'open_url':
        if (params.url !== undefined && params.url !== null && params.url !== '') {
          url = params.url;
          console.log('✅ Open custom URL:', url);
        } else {
          console.log('⚠️ URL missing in params:', params);
        }
        break;

      default:
        console.log('⚠️ Unknown action type:', banner.action_type);
        break;
    }

    // If we didn't get a URL from action_type, fall back to link_url
    if (!url) {
      console.log('⚠️ No URL from action_type, falling back to link_url:', banner?.link_url);
      url = banner?.link_url || null;
    }

    return url;
  };

  const handleBannerClick = (e?: React.MouseEvent | React.KeyboardEvent) => {
    // Prevent default if event is provided
    if (e) {
      e.preventDefault();
      if ('stopPropagation' in e) {
        e.stopPropagation();
      }
    }

    console.log('🖱️ Banner clicked!', {
      banner: banner?.id,
      action_type: banner?.action_type,
      has_action_params: !!banner?.action_params
    });
    
    const url = buildActionUrl();
    
    console.log('📍 Final URL to navigate:', url);

    if (!url) {
      console.log('❌ No URL to navigate to - banner will not navigate');
      console.log('💡 Tip: Check that action_type and action_params are properly set in the admin panel');
      return;
    }

    try {
      // Check if it's an external URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('🌐 External URL detected');
        if (banner?.target === '_blank') {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
      } else {
        // Internal navigation
        console.log('🏠 Internal navigation to:', url);
        router.push(url);
      }
    } catch (error) {
      console.error('❌ Error navigating:', error);
      // Fallback to window.location if router.push fails
      window.location.href = url;
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
      className={`relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg cursor-pointer ${className}`}
      style={{
        backgroundColor: banner.background_color,
        color: banner.text_color
      }}
      onClick={(e) => handleBannerClick(e)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBannerClick(e);
        }
      }}
    >
      {imageUrl ? (
        <div className="flex flex-col">
          {/* Image Container */}
          <div className="relative">
            <img
              src={imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover pointer-events-none"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBannerClick();
                  }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick();
              }}
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

