'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductWithDetails, Category, Brand } from '@/types/database';
import { ProductDiscount } from '@/lib/discount-utils';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import { SortAsc, SortDesc, Search, Filter, X } from 'lucide-react';

interface VendorFilter {
  id: string;
  business_name: string;
  status?: string;
}

interface ProductsClientProps {
  initialProducts: ProductWithDetails[];
  initialCategories: Category[];
  initialBrands: Brand[];
  initialVendors: VendorFilter[];
  initialProductDiscounts: Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>;
  initialFilters: {
    categories: string[];
    brands: string[];
    vendors: string[];
    minPrice: string;
    maxPrice: string;
    discountMin: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export default function ProductsClient({
  initialProducts,
  initialCategories,
  initialBrands,
  initialVendors,
  initialProductDiscounts,
  initialFilters
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [categories] = useState(initialCategories);
  const [brands] = useState(initialBrands);
  const [vendors] = useState(initialVendors);
  const [filters, setFilters] = useState({
    categories: initialFilters.categories,
    brands: initialFilters.brands,
    vendors: initialFilters.vendors,
    minPrice: initialFilters.minPrice,
    maxPrice: initialFilters.maxPrice,
    discountMin: initialFilters.discountMin || ''
  });
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder);
  const [productDiscounts, setProductDiscounts] = useState(initialProductDiscounts);
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Sync products state when initialProducts prop changes (after server re-fetch)
  useEffect(() => {
    setProducts(initialProducts);
    setProductDiscounts(initialProductDiscounts);
    setLoading(false);
  }, [initialProducts, initialProductDiscounts]);

  // Sync state with URL params on mount
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  // Update URL when filters change and refresh data
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary navigation
    if (isInitialMount) return;

    setLoading(true); // Show loading state while fetching

    const params = new URLSearchParams();
    
    if (filters.categories.length > 0) {
      params.set('category', filters.categories[0]);
    }
    if (filters.brands.length > 0) {
      params.set('brand', filters.brands[0]);
    }
    if (filters.vendors.length > 0) {
      params.set('vendor', filters.vendors[0]);
    }
    if (filters.minPrice) {
      params.set('minPrice', filters.minPrice);
    }
    if (filters.maxPrice) {
      params.set('maxPrice', filters.maxPrice);
    }
    if (filters.discountMin) {
      params.set('discountMin', filters.discountMin);
    }
    if (sortBy !== 'name') {
      params.set('sort', sortBy);
    }
    if (sortOrder !== 'asc') {
      params.set('order', sortOrder);
    }

    const newUrl = params.toString() ? `/products?${params.toString()}` : '/products';
    
    // Use router.push to trigger a server-side re-fetch
    // This will cause the page component to re-render with new data
    router.push(newUrl, { scroll: false });
  }, [filters, sortBy, sortOrder, router, isInitialMount]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setLoading(true); // Show loading state when filters change
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      vendors: [],
      minPrice: '',
      maxPrice: '',
      discountMin: ''
    });
    setSortBy('name');
    setSortOrder('asc');
  };

  return (
    <>
      {/* Controls */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-end">
					{/* Mobile Filter Toggle */}
					<div className="w-full lg:hidden">
						<button
							onClick={() => setShowFilters(!showFilters)}
							className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						>
							<span className="flex items-center gap-2 text-sm text-gray-700"><Filter className="h-4 w-4 text-gray-600" /> Filters</span>
							{showFilters ? (
								<X className="h-4 w-4 text-gray-600" />
							) : null}
						</button>
					</div>
          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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

			<div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
				<div className={`w-full lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
					<div className="bg-white rounded-lg shadow-sm lg:sticky lg:top-4">
						<ProductFilters
							filters={filters}
							categories={categories}
							brands={brands}
							vendors={vendors}
							onFilterChange={handleFilterChange}
							onClearFilters={clearFilters}
						/>
					</div>
				</div>

        {/* Products Grid/List */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
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
    </>
  );
}







