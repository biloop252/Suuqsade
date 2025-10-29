'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HomepageSection, HomepageSectionType, ProductWithDetails } from '@/types/database';
import ProductCard from '@/components/products/ProductCard';
import { ProductDiscount, getBatchProductDiscounts, calculateBestDiscount } from '@/lib/discount-utils';
import { Star, ShoppingBag, Truck, ShieldCheck, Sparkles, Crown, Gift, Percent, Home as HomeIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface SectionWithProducts extends HomepageSection {
  products: ProductWithDetails[];
}

const baseProductSelect = `
  *,
  category:categories(*),
  brand:brands(*),
  images:product_images(*),
  variants:product_variants(*),
  reviews:reviews(*)
`;

export default function HomepageSections() {
  const [sections, setSections] = useState<SectionWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountsMap, setDiscountsMap] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const { data: secs, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;

      const sectionsWithProducts: SectionWithProducts[] = [];
      for (const s of secs || []) {
        const products = await fetchProductsForSection(s);
        sectionsWithProducts.push({ ...s, products });
      }

      setSections(sectionsWithProducts);

      // Gather all products for discount precompute
      const allProducts = sectionsWithProducts.flatMap(s => s.products);
      if (allProducts.length > 0) {
        try {
          const discountMap = await getBatchProductDiscounts(allProducts);
          const processed: Record<string, { discounts: ProductDiscount[]; discountInfo: { final_price: number; discount_amount: number; has_discount: boolean } }> = {};
          for (const product of allProducts) {
            const productDiscounts = discountMap[product.id] || [];
            const discountCalculation = calculateBestDiscount(product, productDiscounts);
            processed[product.id] = {
              discounts: productDiscounts,
              discountInfo: {
                final_price: discountCalculation.final_price,
                discount_amount: discountCalculation.discount_amount,
                has_discount: discountCalculation.discount_amount > 0
              }
            };
          }
          setDiscountsMap(processed);
        } catch (e) {
          // ignore discount precompute errors; ProductCard will fallback
        }
      }
    } catch (e) {
      console.error('Error loading homepage sections:', e);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsForSection = async (s: HomepageSection): Promise<ProductWithDetails[]> => {
    try {
      let query = supabase.from('products').select(baseProductSelect).eq('is_active', true);

      switch (s.section_type as HomepageSectionType) {
        case 'category':
          if (!s.category_id) return [];
          query = query.eq('category_id', s.category_id);
          break;
        case 'brand':
          if (!s.brand_id) return [];
          query = query.eq('brand_id', s.brand_id);
          break;
        case 'tag': {
          if (!s.tag_id) return [];
          const { data: tagRows, error: tagErr } = await supabase
            .from('product_tag_assignments')
            .select('product_id')
            .eq('tag_id', s.tag_id);
          if (tagErr) { console.error(tagErr); return []; }
          const ids = (tagRows || []).map(r => r.product_id).filter(Boolean);
          if (ids.length === 0) return [];
          query = query.in('id', ids);
          break;
        }
        case 'popular':
          // Featured first then recent
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'trending':
          // Recent
          query = query.order('created_at', { ascending: false });
          break;
        case 'new_arrivals':
          query = query.order('created_at', { ascending: false });
          break;
        case 'best_selling':
          // Proxy: pull more then sort by reviews count desc client-side
          query = query.order('created_at', { ascending: false });
          break;
        case 'recommended':
          // Proxy: recent
          query = query.order('created_at', { ascending: false });
          break;
        case 'flash_deals':
          // Proxy: featured as deals
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      if (s.product_limit && s.product_limit > 0) {
        query = query.limit(s.product_limit);
      } else {
        query = query.limit(12);
      }

      // For best_selling, fetch more for better sorting later
      const fetchLimit = s.section_type === 'best_selling' ? Math.max(24, s.product_limit || 12) : (s.product_limit || 12);
      const { data, error } = await query.limit(fetchLimit);
      if (error) { console.error('Products error:', error); return []; }
      let products = (data || []) as unknown as ProductWithDetails[];
      if (s.section_type === 'best_selling') {
        products = products
          .map(p => ({ p, count: (p.reviews || []).length }))
          .sort((a, b) => b.count - a.count)
          .map(x => x.p);
      }
      if (s.product_limit && products.length > s.product_limit) {
        products = products.slice(0, s.product_limit);
      }
      return products;
    } catch (e) {
      console.error('fetchProductsForSection error:', e);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <section key={i} className="py-6 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-8 w-40 bg-gray-200 rounded mb-4" />
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex-shrink-0 w-56 sm:w-64 h-60 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-6">
      {sections.map((s) => {
        const icons = [Star, ShoppingBag, Truck, ShieldCheck, Sparkles, Crown, Gift, Percent, HomeIcon];
        const hash = (str: string) => {
          let h = 0;
          for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
          return Math.abs(h);
        };
        const Icon = icons[hash(s.id) % icons.length];
        const containerId = `section-products-container-${s.id}`;

        return (
          <section
            key={s.id}
            className="py-6"
            style={{
              backgroundColor: s.background_color || undefined,
              backgroundImage: s.background_image_url ? `url(${s.background_image_url})` : undefined,
              backgroundSize: s.background_image_url ? 'cover' as const : undefined,
              backgroundPosition: s.background_image_url ? 'center' as const : undefined,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-500 rounded-lg p-2">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      {s.title && (
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{s.title}</h2>
                      )}
                      {s.subtitle && (
                        <p className="text-xs sm:text-sm text-gray-600">{s.subtitle}</p>
                      )}
                    </div>
                  </div>
                  {/* View All button */}
                  {(() => {
                    const href = (() => {
                      switch (s.section_type) {
                        case 'category':
                          return s.category_id ? `/products?category=${s.category_id}` : '/products';
                        case 'brand':
                          return s.brand_id ? `/products?brand=${s.brand_id}` : '/products';
                        case 'new_arrivals':
                          return '/products?sort=name&order=desc';
                        case 'popular':
                        case 'trending':
                        case 'best_selling':
                        case 'recommended':
                        case 'flash_deals':
                        case 'tag':
                        default:
                          return '/products?sort=name';
                      }
                    })();
                    return (
                      <a href={href} className="bg-gray-100 text-gray-700 px-3 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base whitespace-nowrap self-start sm:self-auto rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 border border-gray-200">
                        <span>View All</span>
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    );
                  })()}
                </div>
              )}

              {/* Horizontal scroll product cards with always-visible arrows */}
              <div className="relative">
                <div id={containerId} className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
                  {s.products.map((p) => (
                    <div key={p.id} className="flex-shrink-0 w-56 sm:w-64">
                      <ProductCard
                        product={p}
                        hideBrand={true}
                        variant="compact"
                        alwaysShowActions={true}
                        discountData={discountsMap[p.id] ? {
                          discounts: discountsMap[p.id].discounts,
                          discountInfo: discountsMap[p.id].discountInfo
                        } : undefined}
                      />
                    </div>
                  ))}
                </div>

                {/* Left Scroll Arrow */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 translate-x-4">
                  <button
                    onClick={() => {
                      const container = document.getElementById(containerId);
                      if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                    }}
                    className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Right Scroll Arrow */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-4">
                  <button
                    onClick={() => {
                      const container = document.getElementById(containerId);
                      if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                    }}
                    className="bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 border border-gray-200"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}


