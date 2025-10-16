import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails, Category, Brand } from '@/types/database';
import { ProductDiscount, getBatchProductDiscounts, calculateBestDiscount } from '@/lib/discount-utils';
import dynamic from 'next/dynamic';

// Dynamically import the client component to reduce initial bundle size
const ProductsClient = dynamic(() => import('./ProductsClient'), {
  loading: () => <div>Loading products...</div>,
  ssr: false
});

interface ProductsPageProps {
  searchParams: {
    brand?: string;
    category?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    minPrice?: string;
    maxPrice?: string;
  };
}

async function getProducts(filters: {
  categories: string[];
  brands: string[];
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      brand:brands(*),
      vendor:vendor_profiles(business_name, city, country),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq('is_active', true);

  // Apply filters
  if (filters.categories.length > 0) {
    query = query.in('category_id', filters.categories);
  }
  if (filters.brands.length > 0) {
    query = query.in('brand_id', filters.brands);
  }
  if (filters.minPrice) {
    query = query.gte('price', parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    query = query.lte('price', parseFloat(filters.maxPrice));
  }

  // Apply sorting
  const sortColumn = filters.sortBy === 'price' ? 'price' : 'name';
  query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

async function getFiltersData() {
  try {
    // Fetch categories and brands in parallel
    const [categoriesResult, brandsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name'),
      supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name')
    ]);

    return {
      categories: categoriesResult.data || [],
      brands: brandsResult.data || []
    };
  } catch (error) {
    console.error('Error fetching filters data:', error);
    return {
      categories: [],
      brands: []
    };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse search parameters
  const filters = {
    categories: searchParams.category ? [searchParams.category] : [],
    brands: searchParams.brand ? [searchParams.brand] : [],
    minPrice: searchParams.minPrice || '',
    maxPrice: searchParams.maxPrice || '',
    sortBy: searchParams.sort || 'name',
    sortOrder: (searchParams.order as 'asc' | 'desc') || 'asc'
  };

  // Fetch data in parallel
  const [products, filtersData] = await Promise.all([
    getProducts(filters),
    getFiltersData()
  ]);

  // Process discounts for products
  let productDiscounts: Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }> = {};

  if (products.length > 0) {
    try {
      const discountMap = await getBatchProductDiscounts(products);
      
      const processedDiscountMap: Record<string, {
        discounts: ProductDiscount[];
        discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
      }> = {};

      // Calculate discount info for each product
      products.forEach(product => {
        const productDiscounts = discountMap[product.id] || [];
        const discountCalculation = calculateBestDiscount(product, productDiscounts);
        
        processedDiscountMap[product.id] = {
          discounts: productDiscounts,
          discountInfo: {
            final_price: discountCalculation.final_price,
            discount_amount: discountCalculation.discount_amount,
            has_discount: discountCalculation.discount_amount > 0
          }
        };
      });

      productDiscounts = processedDiscountMap;
    } catch (discountError) {
      console.error('Error fetching batch discounts:', discountError);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ProductsClient
            initialProducts={products}
            initialCategories={filtersData.categories}
            initialBrands={filtersData.brands}
            initialProductDiscounts={productDiscounts}
            initialFilters={filters}
          />
        </Suspense>
      </div>
    </div>
  );
}

// Generate static params for common filter combinations
export async function generateStaticParams() {
  // Generate static pages for common category and brand combinations
  const commonParams = [
    {},
    { category: 'electronics' },
    { category: 'fashion' },
    { category: 'home-garden' },
    { brand: 'apple' },
    { brand: 'samsung' },
    { sort: 'price', order: 'asc' },
    { sort: 'price', order: 'desc' },
    { sort: 'name', order: 'asc' },
    { sort: 'name', order: 'desc' }
  ];

  return commonParams.map((params) => ({
    searchParams: params
  }));
}