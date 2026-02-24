import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { ProductWithDetails, Category, Brand } from '@/types/database';
import { ProductDiscount, getBatchProductDiscounts, calculateBestDiscount } from '@/lib/discount-utils';
import dynamicImport from 'next/dynamic';

// Ensure this page is dynamically rendered to allow filter changes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Dynamically import the client component to reduce initial bundle size
const ProductsClient = dynamicImport(() => import('./ProductsClient'), {
  loading: () => <div>Loading products...</div>,
  ssr: false
});

interface ProductsPageProps {
  searchParams: {
    brand?: string | string[];
    category?: string | string[];
    categoryId?: string | string[];
    vendor?: string | string[];
    sort?: string;
    order?: 'asc' | 'desc';
    minPrice?: string;
    maxPrice?: string;
    discountMin?: string;
    flashSale?: string;
    color?: string;
    size?: string;
  };
}

/** Normalize URL param to string array (supports multiple categoryId= & brand= & vendor=). */
function paramToArray(v: string | string[] | undefined): string[] {
  if (v == null || v === '') return [];
  return Array.isArray(v) ? v.filter(Boolean) : [v];
}

/** Given selected category IDs and full category list, return selected IDs plus all descendant IDs (for parent categories). */
function expandCategoryIdsWithDescendants(selectedIds: string[], allCategories: Category[]): string[] {
  if (selectedIds.length === 0) return [];
  const byParent = new Map<string, Category[]>();
  const byId = new Map<string, Category>();
  allCategories.forEach((c) => {
    byId.set(c.id, c);
    const pid = c.parent_id ?? '';
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  });
  const result = new Set<string>();
  function addDescendants(id: string) {
    result.add(id);
    const children = byParent.get(id) ?? [];
    children.forEach((child) => addDescendants(child.id));
  }
  selectedIds.forEach((id) => addDescendants(id));
  return Array.from(result);
}

/** Server-only: aggregate units sold per product from order_items (no DB schema change). */
async function getProductUnitsSold(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.from('order_items').select('product_id, quantity').limit(10000);
    if (error) return map;
    (data || []).forEach((row: { product_id: string; quantity: number }) => {
      const id = row.product_id;
      map.set(id, (map.get(id) ?? 0) + (row.quantity ?? 0));
    });
  } catch {
    // no service role or RLS: fallback to empty map (products keep current order)
  }
  return map;
}

async function getProducts(filters: {
  categories: string[];
  brands: string[];
  vendors: string[];
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  discountMin?: string;
  flashSale?: boolean;
  color?: string;
  size?: string;
}) {
  const isRating = filters.sortBy === 'rating';
  const isBestSelling = filters.sortBy === 'best_selling';
  const needsReviews = isRating || isBestSelling;

  const baseSelect = `
    *,
    category:categories(*),
    brand:brands(*),
    vendor:vendor_profiles(business_name, city, country),
    images:product_images(*),
    variants:product_variants(*)
    ${needsReviews ? ', reviews:reviews(rating)' : ''}
  `;

  let query = supabase
    .from('products')
    .select(baseSelect)
    .eq('is_active', true);

  if (filters.categories.length > 0) {
    query = query.in('category_id', filters.categories);
  }
  if (filters.brands.length > 0) {
    query = query.in('brand_id', filters.brands);
  }
  if (filters.vendors.length > 0) {
    query = query.in('vendor_id', filters.vendors);
  }
  if (filters.minPrice) {
    query = query.gte('price', parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    query = query.lte('price', parseFloat(filters.maxPrice));
  }

  // DB order only for name/price/newest; rating and best_selling sorted in app
  if (!isRating && !isBestSelling) {
    const sortColumn = filters.sortBy === 'price' ? 'price' : filters.sortBy === 'newest' ? 'created_at' : 'name';
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  let products = (data || []) as any[];

  if (filters.sortBy === 'rating') {
    const asc = filters.sortOrder === 'asc';
    products = [...products].sort((a, b) => {
      const avg = (r: { rating?: number }[]) =>
        r?.length ? r.reduce((s, x) => s + (x?.rating ?? 0), 0) / r.length : 0;
      const ra = avg(a.reviews || []);
      const rb = avg(b.reviews || []);
      return asc ? ra - rb : rb - ra;
    });
  }

  if (filters.sortBy === 'best_selling') {
    const unitsByProduct = await getProductUnitsSold();
    const asc = filters.sortOrder === 'asc';
    products = [...products].sort((a, b) => {
      const ua = unitsByProduct.get(a.id) ?? 0;
      const ub = unitsByProduct.get(b.id) ?? 0;
      return asc ? ua - ub : ub - ua;
    });
  }

  return products;
}

async function getFiltersData() {
  try {
    // Fetch categories, brands, and vendors in parallel
    const [categoriesResult, brandsResult, vendorsResult] = await Promise.all([
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
        .order('name'),
      supabase
        .from('vendor_profiles')
        .select('id, business_name, status')
        .eq('status', 'active')
        .order('business_name')
    ]);

    return {
      categories: categoriesResult.data || [],
      brands: brandsResult.data || [],
      vendors: vendorsResult.data || []
    };
  } catch (error) {
    console.error('Error fetching filters data:', error);
    return {
      categories: [],
      brands: [],
      vendors: []
    };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse search parameters (support multiple categoryId, brand, vendor)
  const categoryIds = [
    ...paramToArray(searchParams.category),
    ...paramToArray(searchParams.categoryId)
  ];
  const brandFilter = paramToArray(searchParams.brand);
  const vendorFilter = paramToArray(searchParams.vendor);

  // Fetch filter options first so we can expand parent categories
  const filtersData = await getFiltersData();
  const expandedCategoryIds = expandCategoryIdsWithDescendants(categoryIds, filtersData.categories);

  const filters = {
    categories: expandedCategoryIds,
    brands: brandFilter,
    vendors: vendorFilter,
    minPrice: searchParams.minPrice || '',
    maxPrice: searchParams.maxPrice || '',
    sortBy: searchParams.sort || 'name',
    sortOrder: (searchParams.order as 'asc' | 'desc') || 'asc',
    discountMin: searchParams.discountMin,
    flashSale: searchParams.flashSale === 'true',
    color: searchParams.color,
    size: searchParams.size
  };

  const products = await getProducts(filters);

  // Process discounts for products
  let productDiscounts: Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }> = {};

  let filteredProducts = products;

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

      // Apply additional filters based on discount info
      if (filters.discountMin || filters.flashSale || filters.color || filters.size) {
        filteredProducts = products.filter(product => {
          const discountInfo = processedDiscountMap[product.id]?.discountInfo;
          
          // Filter by minimum discount percentage
          if (filters.discountMin) {
            const discountPercent = discountInfo 
              ? (discountInfo.discount_amount / product.price) * 100 
              : 0;
            if (discountPercent < parseFloat(filters.discountMin)) {
              return false;
            }
          }

          // Filter by flash sale (products with discounts)
          if (filters.flashSale) {
            if (!discountInfo?.has_discount) {
              return false;
            }
          }

          // Filter by color (check product variants or attributes)
          if (filters.color) {
            const hasColor = product.variants?.some((v: any) => 
              v.attributes?.some((attr: any) => 
                attr.name?.toLowerCase() === 'color' && 
                attr.value?.toLowerCase().includes(filters.color!.toLowerCase())
              )
            ) || product.attributes?.some((attr: any) => 
              attr.name?.toLowerCase() === 'color' && 
              attr.value?.toLowerCase().includes(filters.color!.toLowerCase())
            );
            if (!hasColor) {
              return false;
            }
          }

          // Filter by size (check product variants or attributes)
          if (filters.size) {
            const hasSize = product.variants?.some((v: any) => 
              v.attributes?.some((attr: any) => 
                attr.name?.toLowerCase() === 'size' && 
                attr.value?.toLowerCase().includes(filters.size!.toLowerCase())
              )
            ) || product.attributes?.some((attr: any) => 
              attr.name?.toLowerCase() === 'size' && 
              attr.value?.toLowerCase().includes(filters.size!.toLowerCase())
            );
            if (!hasSize) {
              return false;
            }
          }

          return true;
        });
      }
    } catch (discountError) {
      console.error('Error fetching batch discounts:', discountError);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ProductsClient
            initialProducts={filteredProducts}
            initialCategories={filtersData.categories}
            initialBrands={filtersData.brands}
            initialVendors={filtersData.vendors}
            initialProductDiscounts={productDiscounts}
            initialFilters={{
              categories: categoryIds,
              brands: brandFilter,
              vendors: vendorFilter,
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
              discountMin: filters.discountMin || '',
              sortBy: filters.sortBy,
              sortOrder: filters.sortOrder
            }}
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