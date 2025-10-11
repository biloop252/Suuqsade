'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, Brand } from '@/types/database';
import { XIcon } from 'lucide-react';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';

interface ProductFiltersProps {
  filters: {
    categories: string[];
    brands: string[];
    minPrice: string;
    maxPrice: string;
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
    <Accordion className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClearFilters}
          className="text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200"
        >
          Clear all
        </button>
      </div>

      {/* Categories Accordion */}
      <AccordionItem title="Categories" defaultOpen={true}>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {categories.map((category) => {
            const isSubcategory = category.parent_id !== null;
            const isChecked = filters.categories.includes(category.id);
            
            const handleCategoryChange = (categoryId: string, checked: boolean) => {
              if (checked) {
                onFilterChange({ categories: [...filters.categories, categoryId] });
              } else {
                onFilterChange({ categories: filters.categories.filter(id => id !== categoryId) });
              }
            };
            
            return (
              <label key={category.id} className={`flex items-center ${isSubcategory ? 'ml-4' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className={`ml-2 text-sm text-gray-700 ${isSubcategory ? 'text-gray-600' : 'font-medium'}`}>
                  {category.name}
                </span>
              </label>
            );
          })}
        </div>
      </AccordionItem>

      {/* Brands Accordion */}
      <AccordionItem title="Brands" defaultOpen={false}>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {brands.map((brand) => {
            const isChecked = filters.brands.includes(brand.id);
            
            const handleBrandChange = (brandId: string, checked: boolean) => {
              if (checked) {
                onFilterChange({ brands: [...filters.brands, brandId] });
              } else {
                onFilterChange({ brands: filters.brands.filter(id => id !== brandId) });
              }
            };
            
            return (
              <label key={brand.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleBrandChange(brand.id, e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
              </label>
            );
          })}
        </div>
      </AccordionItem>

      {/* Price Range Accordion */}
      <AccordionItem title="Price Range" defaultOpen={false}>
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
      </AccordionItem>

      {/* Quick Price Filters Accordion */}
      <AccordionItem title="Quick Filters" defaultOpen={false}>
        <div className="space-y-2">
          <button
            onClick={() => onFilterChange({ minPrice: '0', maxPrice: '50' })}
            className="block w-full text-left text-sm text-gray-700 hover:text-primary-600 transition-colors duration-200"
          >
            Under $50
          </button>
          <button
            onClick={() => onFilterChange({ minPrice: '50', maxPrice: '100' })}
            className="block w-full text-left text-sm text-gray-700 hover:text-primary-600 transition-colors duration-200"
          >
            $50 - $100
          </button>
          <button
            onClick={() => onFilterChange({ minPrice: '100', maxPrice: '200' })}
            className="block w-full text-left text-sm text-gray-700 hover:text-primary-600 transition-colors duration-200"
          >
            $100 - $200
          </button>
          <button
            onClick={() => onFilterChange({ minPrice: '200', maxPrice: '' })}
            className="block w-full text-left text-sm text-gray-700 hover:text-primary-600 transition-colors duration-200"
          >
            Over $200
          </button>
        </div>
      </AccordionItem>
    </Accordion>
  );
}
