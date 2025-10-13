'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PromotionalMedia } from '@/types/database';
import { ZapIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';

interface LimitedTimeDealsProps {
  className?: string;
  maxDeals?: number;
}

export default function LimitedTimeDeals({ className = '', maxDeals = 4 }: LimitedTimeDealsProps) {
  const [deals, setDeals] = useState<PromotionalMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimitedTimeDeals();
  }, []);

  const fetchLimitedTimeDeals = async () => {
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
        .eq('banner_position', 'limited_time_deals')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true })
        .limit(maxDeals);

      if (error) {
        console.error('Error fetching limited time deals:', error);
        return;
      }

      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching limited time deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDealClick = (deal: PromotionalMedia) => {
    if (deal.link_url) {
      if (deal.target === '_blank') {
        window.open(deal.link_url, '_blank');
      } else {
        window.location.href = deal.link_url;
      }
    }
  };

  if (loading) {
    return (
      <section className={`py-6 bg-gradient-to-r from-red-50 to-orange-50 relative overflow-hidden ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/90 rounded-xl h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (deals.length === 0) {
    return null; // Don't render the section if no deals are available
  }

  // Color schemes for different deals
  const colorSchemes = [
    { bg: 'from-red-500 to-orange-500', border: 'border-red-100', hover: 'from-red-500/5 to-orange-500/5', text: 'text-red-600', button: 'bg-red-500 hover:bg-red-600' },
    { bg: 'from-orange-500 to-yellow-500', border: 'border-orange-100', hover: 'from-orange-500/5 to-yellow-500/5', text: 'text-orange-600', button: 'bg-orange-500 hover:bg-orange-600' },
    { bg: 'from-red-500 to-orange-500', border: 'border-red-100', hover: 'from-red-500/5 to-orange-500/5', text: 'text-red-600', button: 'bg-red-500 hover:bg-red-600' },
    { bg: 'from-orange-500 to-yellow-500', border: 'border-orange-100', hover: 'from-orange-500/5 to-yellow-500/5', text: 'text-orange-600', button: 'bg-orange-500 hover:bg-orange-600' }
  ];

  return (
    <section className={`py-6 bg-gradient-to-r from-red-50 to-orange-50 relative overflow-hidden ${className}`}>
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
          {deals.map((deal, index) => {
            const colorScheme = colorSchemes[index % colorSchemes.length];
            
            return (
              <div 
                key={deal.id}
                className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border ${colorScheme.border} hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden cursor-pointer`}
                onClick={() => handleDealClick(deal)}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${colorScheme.hover} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative p-6">
                  <div className="text-center">
                    {/* Badge */}
                    <div className={`bg-gradient-to-r ${colorScheme.bg} text-white text-xs px-3 py-1 rounded-full font-bold mb-3 inline-block`}>
                      {deal.subtitle || 'LIMITED TIME'}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{deal.title}</h3>
                    
                    {/* Description/Offer */}
                    <p className={`text-2xl font-bold ${colorScheme.text} mb-2`}>
                      {deal.description || 'Special Offer'}
                    </p>
                    
                    {/* Button */}
                    <div 
                      className={`${colorScheme.button} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}
                    >
                      {deal.button_text || 'Shop Now'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
