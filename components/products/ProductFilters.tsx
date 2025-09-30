'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, Brand } from '@/types/database';
import { XIcon } from 'lucide-react';

interface ProductFiltersProps {
  filters: {
    category: string;
    brand: string;
    minPrice: string;
    maxPrice: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export default function ProductFilters({ filters, onFilterChange, onClearFilters }: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories (including subcategories)
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
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClearFilters}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
          <div className="space-y-2">
            {categories.map((category) => {
              const isSubcategory = category.parent_id !== null;
              return (
                <label key={category.id} className={`flex items-center ${isSubcategory ? 'ml-4' : ''}`}>
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={filters.category === category.id}
                    onChange={(e) => onFilterChange({ category: e.target.value })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className={`ml-2 text-sm text-gray-700 ${isSubcategory ? 'text-gray-600' : 'font-medium'}`}>
                    {category.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Brands */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Brands</h4>
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand.id} className="flex items-center">
                <input
                  type="radio"
                  name="brand"
                  value={brand.id}
                  checked={filters.brand === brand.id}
                  onChange={(e) => onFilterChange({ brand: e.target.value })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Price</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => onFilterChange({ minPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Price</label>
              <input
                type="number"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Quick Price Filters */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h4>
          <div className="space-y-2">
            <button
              onClick={() => onFilterChange({ minPrice: '0', maxPrice: '50' })}
              className="block w-full text-left text-sm text-gray-700 hover:text-primary-600"
            >
              Under $50
            </button>
            <button
              onClick={() => onFilterChange({ minPrice: '50', maxPrice: '100' })}
              className="block w-full text-left text-sm text-gray-700 hover:text-primary-600"
            >
              $50 - $100
            </button>
            <button
              onClick={() => onFilterChange({ minPrice: '100', maxPrice: '200' })}
              className="block w-full text-left text-sm text-gray-700 hover:text-primary-600"
            >
              $100 - $200
            </button>
            <button
              onClick={() => onFilterChange({ minPrice: '200', maxPrice: '' })}
              className="block w-full text-left text-sm text-gray-700 hover:text-primary-600"
            >
              Over $200
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
