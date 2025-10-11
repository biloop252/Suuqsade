'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand';
  image?: string;
  slug?: string;
}

export function useSearchSuggestions(query: string, debounceMs: number = 300) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const searchTerm = query.toLowerCase().trim();
        
        // Fetch products
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, slug, images:product_images(*)')
          .ilike('name', `%${searchTerm}%`)
          .eq('is_active', true)
          .limit(3);

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name, slug, image_url')
          .ilike('name', `%${searchTerm}%`)
          .eq('is_active', true)
          .limit(2);

        // Fetch brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('id, name, slug, logo_url')
          .ilike('name', `%${searchTerm}%`)
          .eq('is_active', true)
          .limit(2);

        const suggestions: SearchSuggestion[] = [];

        // Add products
        if (productsData) {
          productsData.forEach(product => {
            suggestions.push({
              id: product.id,
              text: product.name,
              type: 'product',
              image: product.images?.[0]?.image_url,
              slug: product.slug
            });
          });
        }

        // Add categories
        if (categoriesData) {
          categoriesData.forEach(category => {
            suggestions.push({
              id: category.id,
              text: category.name,
              type: 'category',
              slug: category.slug,
              image: category.image_url // Add if categories have images
            });
          });
        }

        // Add brands
        if (brandsData) {
          brandsData.forEach(brand => {
            suggestions.push({
              id: brand.id,
              text: brand.name,
              type: 'brand',
              slug: brand.slug,
              image: brand.logo_url // Add if brands have logos
            });
          });
        }

        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs]);

  return { suggestions, loading };
}
