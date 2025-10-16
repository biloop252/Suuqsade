import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails } from '@/types/database';
import dynamic from 'next/dynamic';

// Dynamically import the client component to reduce initial bundle size
const SearchClient = dynamic(() => import('./SearchClient'), {
  loading: () => <div>Loading search...</div>,
  ssr: false
});

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}

async function searchProducts(searchQuery: string, filters: {
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) {
  if (!searchQuery.trim()) {
    return [];
  }

  try {
    // Build the query with search functionality
    let supabaseQuery = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('is_active', true);

    // Add search conditions
    supabaseQuery = supabaseQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);

    // Add category filter
    if (filters.category) {
      supabaseQuery = supabaseQuery.eq('category_id', filters.category);
    }

    // Add brand filter
    if (filters.brand) {
      supabaseQuery = supabaseQuery.eq('brand_id', filters.brand);
    }

    // Add price range filter
    if (filters.minPrice) {
      supabaseQuery = supabaseQuery.gte('price', parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      supabaseQuery = supabaseQuery.lte('price', parseFloat(filters.maxPrice));
    }

    // Add sorting
    const sortColumn = filters.sortBy === 'price' ? 'price' : 'name';
    supabaseQuery = supabaseQuery.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  
  const filters = {
    category: searchParams.category || '',
    brand: searchParams.brand || '',
    minPrice: searchParams.minPrice || '',
    maxPrice: searchParams.maxPrice || '',
    sortBy: searchParams.sort || 'name',
    sortOrder: (searchParams.order as 'asc' | 'desc') || 'asc'
  };

  const products = await searchProducts(query, filters);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <SearchClient
            initialQuery={query}
            initialProducts={products}
            initialFilters={filters}
          />
        </Suspense>
      </div>
    </div>
  );
}

// Generate static params for common search terms
export async function generateStaticParams() {
  const commonSearches = [
    { q: 'electronics' },
    { q: 'fashion' },
    { q: 'home' },
    { q: 'sports' },
    { q: 'books' },
    { q: 'beauty' },
    { q: 'automotive' },
    { q: 'toys' }
  ];

  return commonSearches.map((params) => ({
    searchParams: params
  }));
}