'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails, Category, Brand } from '@/types/database';
import { ProductDiscount, getBatchProductDiscounts, calculateBestDiscount } from '@/lib/discount-utils';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import { SortAsc, SortDesc, Search } from 'lucide-react';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    minPrice: '',
    maxPrice: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [productDiscounts, setProductDiscounts] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});

  // Initialize filters from URL parameters
  useEffect(() => {
    const brandParam = searchParams.get('brand');
    const categoryParam = searchParams.get('category');
    
    if (brandParam || categoryParam) {
      setFilters(prev => ({
        ...prev,
        brands: brandParam ? [brandParam] : [],
        categories: categoryParam ? [categoryParam] : []
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    fetchFiltersData();
  }, [filters, sortBy, sortOrder]);

  const fetchFiltersData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

      if (brandsError) {
        console.error('Error fetching brands:', brandsError);
      } else {
        setBrands(brandsData || []);
      }
    } catch (error) {
      console.error('Error fetching filters data:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
      const sortColumn = sortBy === 'price' ? 'price' : 'name';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
        
        // Fetch discounts for all products in batch
        if (data && data.length > 0) {
          try {
            const discountMap = await getBatchProductDiscounts(data);
            
            const processedDiscountMap: Record<string, {
              discounts: ProductDiscount[];
              discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
            }> = {};

            // Calculate discount info for each product
            data.forEach(product => {
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

            setProductDiscounts(processedDiscountMap);
          } catch (discountError) {
            console.error('Error fetching batch discounts:', discountError);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      minPrice: '',
      maxPrice: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Controls */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-end">
            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4 text-gray-600" />
                ) : (
                  <SortDesc className="h-4 w-4 text-gray-600" />
                )}
              </button>


            </div>
          </div>

        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Products Grid/List */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    discountData={productDiscounts[product.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}











