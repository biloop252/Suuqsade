'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { MenuIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

interface CategoriesDropdownProps {
  className?: string;
}

export default function CategoriesDropdown({ className = '' }: CategoriesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<{ [key: string]: Category[] }>({});
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Fetch parent categories
      const { data: parentCategories, error: parentError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order')
        .order('name');

      if (parentError) {
        console.error('Error fetching parent categories:', parentError);
        setCategories([]);
        return;
      }

      // Fetch all subcategories
      const { data: allSubcategories, error: subError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .not('parent_id', 'is', null)
        .order('sort_order')
        .order('name');

      if (subError) {
        console.error('Error fetching subcategories:', subError);
        setSubcategories({});
      } else {
        // Group subcategories by parent_id
        const subcategoriesMap: { [key: string]: Category[] } = {};
        allSubcategories?.forEach(subcategory => {
          if (subcategory.parent_id) {
            if (!subcategoriesMap[subcategory.parent_id]) {
              subcategoriesMap[subcategory.parent_id] = [];
            }
            subcategoriesMap[subcategory.parent_id].push(subcategory);
          }
        });
        setSubcategories(subcategoriesMap);
      }

      setCategories(parentCategories || []);
    } catch (error) {
      console.error('Error:', error);
      setCategories([]);
      setSubcategories({});
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
    setHoveredCategory(null);
  };

  const handleCategoryHover = (categoryId: string) => {
    setHoveredCategory(categoryId);
  };

  return (
    <div 
      ref={dropdownRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MenuIcon className="h-4 w-4" />
        <span className="font-medium text-sm">ALL CATEGORIES</span>
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-0 w-[800px] max-w-[calc(100vw-2rem)] bg-white shadow-2xl border border-gray-200 z-50 rounded-lg overflow-hidden sm:w-[800px] w-[calc(100vw-1rem)]">
          {loading ? (
            <div className="px-8 py-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              Loading categories...
            </div>
          ) : (
            <div className="flex min-h-[400px] flex-col sm:flex-row">
              {/* Left Column - Main Categories */}
              <div className="w-full sm:w-64 bg-gray-50 border-r-0 sm:border-r border-gray-200 border-b sm:border-b-0">
                <div className="py-2">
                  {categories.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No categories found
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className={`group cursor-pointer border-l-4 ${
                          hoveredCategory === category.id 
                            ? 'bg-orange-500 text-white border-orange-600' 
                            : 'hover:bg-orange-100 hover:text-orange-600 border-transparent hover:border-orange-300'
                        } transition-all duration-200`}
                        onMouseEnter={() => handleCategoryHover(category.id)}
                      >
                        <Link
                          href={`/categories/${category.slug}`}
                          className="flex items-center justify-between px-6 py-3 text-sm font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex items-center space-x-3">
                            {category.image_url && (
                              <img
                                src={category.image_url}
                                alt={category.name}
                                className="h-6 w-6 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="truncate">{category.name}</span>
                          </div>
                          {subcategories[category.id] && subcategories[category.id].length > 0 && (
                            <ChevronRightIcon className={`h-4 w-4 flex-shrink-0 ${
                              hoveredCategory === category.id ? 'text-white' : 'text-gray-400'
                            }`} />
                          )}
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column - Subcategories */}
              <div className="flex-1 p-4 sm:p-6">
                {hoveredCategory && subcategories[hoveredCategory] && subcategories[hoveredCategory].length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {subcategories[hoveredCategory].map((subcategory) => (
                      <div key={subcategory.id} className="space-y-3">
                        <div className="flex items-center space-x-2 border-b-2 border-orange-200 pb-2">
                          {subcategory.image_url && (
                            <img
                              src={subcategory.image_url}
                              alt={subcategory.name}
                              className="h-5 w-5 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <h3 className="font-bold text-gray-900 text-sm">
                            {subcategory.name}
                          </h3>
                        </div>
                        <div className="space-y-1">
                          <Link
                            href={`/categories/${subcategory.slug}`}
                            className="block text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 px-2 py-1.5 rounded transition-colors duration-200 font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            {subcategory.name}
                          </Link>
                          {subcategory.description && (
                            <p className="text-xs text-gray-500 px-2 leading-relaxed">
                              {subcategory.description}
                            </p>
                          )}
                          {/* Add some sample sub-subcategories for better visual representation */}
                          <div className="space-y-1 ml-2">
                            <Link
                              href={`/categories/${subcategory.slug}?filter=featured`}
                              className="block text-xs text-gray-500 hover:text-orange-400 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => setIsOpen(false)}
                            >
                              Featured {subcategory.name}
                            </Link>
                            <Link
                              href={`/categories/${subcategory.slug}?filter=trending`}
                              className="block text-xs text-gray-500 hover:text-orange-400 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => setIsOpen(false)}
                            >
                              Trending {subcategory.name}
                            </Link>
                            <Link
                              href={`/categories/${subcategory.slug}?filter=sale`}
                              className="block text-xs text-gray-500 hover:text-orange-400 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => setIsOpen(false)}
                            >
                              On Sale
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MenuIcon className="h-10 w-10 text-orange-400" />
                      </div>
                      <p className="text-sm font-medium">Select a category to view subcategories</p>
                      <p className="text-xs text-gray-400 mt-1">Hover over a category on the left to see its subcategories</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
