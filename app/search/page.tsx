'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductWithDetails } from '@/types/database';
import ProductCard from '@/components/products/ProductCard';
import SearchSuggestions from '@/components/ui/SearchSuggestions';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { FilterIcon, GridIcon, ListIcon, XIcon } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(query);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const { suggestions, loading: suggestionsLoading } = useSearchSuggestions(searchTerm);

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      fetchProducts(query);
    }
  }, [query]);

  const fetchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
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
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      fetchProducts(searchQuery.trim());
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Re-fetch products with new filters
    if (searchTerm.trim()) {
      fetchProducts(searchTerm);
    }
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
    
    if (searchTerm.trim()) {
      fetchProducts(searchTerm);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {query ? `Search Results for "${query}"` : 'Search Products'}
          </h1>
          {query && (
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
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filters
                </button>
                
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <GridIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <ListIcon className="h-4 w-4" />
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
            <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
            <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-600">
              Enter a product name, category, or brand to find what you're looking for
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

