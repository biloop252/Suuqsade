'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithDetails } from '@/types/database';
import ProductCard from '@/components/products/ProductCard';
import SearchSuggestions from '@/components/ui/SearchSuggestions';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { Filter, Grid, List, Search } from 'lucide-react';

interface SearchClientProps {
  initialQuery: string;
  initialProducts: ProductWithDetails[];
  initialFilters: {
    category: string;
    brand: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export default function SearchClient({
  initialQuery,
  initialProducts,
  initialFilters
}: SearchClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [filters, setFilters] = useState(initialFilters);
  const { suggestions, loading: suggestionsLoading } = useSearchSuggestions(searchTerm);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.set('q', searchTerm);
    }
    if (filters.category) {
      params.set('category', filters.category);
    }
    if (filters.brand) {
      params.set('brand', filters.brand);
    }
    if (filters.minPrice) {
      params.set('minPrice', filters.minPrice);
    }
    if (filters.maxPrice) {
      params.set('maxPrice', filters.maxPrice);
    }
    if (filters.sortBy !== 'name') {
      params.set('sort', filters.sortBy);
    }
    if (filters.sortOrder !== 'asc') {
      params.set('order', filters.sortOrder);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [searchTerm, filters, router]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      setSearchTerm(searchQuery.trim());
      // The URL update will trigger a server-side re-render
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {initialQuery ? `Search Results for "${initialQuery}"` : 'Search Products'}
        </h1>
        {initialQuery && (
          <p className="text-gray-600">
            {products.length} result{products.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <SearchSuggestions
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearch}
              placeholder="Search products, categories, or brands..."
              suggestions={suggestions}
              loading={suggestionsLoading}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
              </select>
              <button
                onClick={() => handleFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      ) : searchTerm ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters
          </p>
          <button
            onClick={clearFilters}
            className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
          <p className="text-gray-600">
            Enter a product name, category, or brand to find what you're looking for
          </p>
        </div>
      )}
    </>
  );
}

