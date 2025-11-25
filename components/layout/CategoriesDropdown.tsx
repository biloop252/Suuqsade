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
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<{ [key: string]: Category[] }>({});
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Track viewport width to toggle mobile rendering
  useEffect(() => {
    const updateViewport = () => {
      if (typeof window !== 'undefined') {
        setIsMobileView(window.innerWidth < 768);
      }
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
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
      
      // Fetch all categories
      const { data: allCategoriesData, error: allError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (allError) {
        console.error('Error fetching categories:', allError);
        setCategories([]);
        setAllCategories([]);
        setCategoryHierarchy({});
        return;
      }

      // Separate parent categories (no parent_id)
      const parentCategories = allCategoriesData?.filter(cat => !cat.parent_id) || [];
      
      // Group all categories by their parent_id
      const hierarchyMap: { [key: string]: Category[] } = {};
      
      allCategoriesData?.forEach(category => {
        if (category.parent_id) {
          if (!hierarchyMap[category.parent_id]) {
            hierarchyMap[category.parent_id] = [];
          }
          hierarchyMap[category.parent_id].push(category);
        }
      });

      setCategories(parentCategories);
      setAllCategories(allCategoriesData || []);
      setCategoryHierarchy(hierarchyMap);
    } catch (error) {
      console.error('Error:', error);
      setCategories([]);
      setAllCategories([]);
      setCategoryHierarchy({});
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

  const handleCategoryClick = (categoryId: string) => {
    // On mobile, when a parent category is clicked, drill down to its subcategories
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (categoryHierarchy[categoryId] && categoryHierarchy[categoryId].length > 0) {
        setHoveredCategory(categoryId);
        return;
      }
    }
    setIsOpen(false);
  };

  // Recursive function to render all category levels
  const renderCategoryLevel = (parentId: string, level: number = 0): JSX.Element[] => {
    const children = categoryHierarchy[parentId] || [];
    return children.map((category) => (
      <div key={category.id}>
        <Link
          href={`/categories/${category.id}`}
          className="block text-sm text-gray-600 hover:text-primary-500 hover:bg-primary-50 px-2 py-1.5 rounded transition-colors duration-200 font-medium"
          onClick={() => setIsOpen(false)}
        >
          {category.name}
        </Link>
        {/* Recursively render children */}
        {renderCategoryLevel(category.id, level + 1)}
      </div>
    ));
  };

  return (
    <div 
      ref={dropdownRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Categories"
      >
        <MenuIcon className="h-5 w-5" />
        <span className="font-medium text-sm hidden md:inline">ALL CATEGORIES</span>
        <span className="bg-secondary-500 text-gray-900 text-xs px-2 py-0.5 rounded-full hidden md:inline">New</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-0 w-[800px] max-w-[calc(100vw-2rem)] bg-white shadow-2xl border border-gray-200 z-50 rounded-lg overflow-hidden sm:w-[800px] w-[calc(100vw-1rem)]">
          {loading ? (
            <div className="px-8 py-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              Loading categories...
            </div>
          ) : isMobileView ? (
            <div className="min-h-[320px] p-4">
              {hoveredCategory ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      className="text-sm text-gray-600 hover:text-primary-600"
                      onClick={() => setHoveredCategory(null)}
                    >
                      ← Back
                    </button>
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setIsOpen(false)}>✕</button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {(categoryHierarchy[hoveredCategory] || []).map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/categories/${subcategory.id}`}
                        className="block text-sm text-gray-700 hover:text-primary-600 px-2 py-2 rounded"
                        onClick={(e) => {
                          if (categoryHierarchy[subcategory.id] && categoryHierarchy[subcategory.id].length > 0) {
                            e.preventDefault();
                            setHoveredCategory(subcategory.id);
                          } else {
                            setIsOpen(false);
                          }
                        }}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className="text-left text-sm text-gray-700 hover:text-primary-600 px-2 py-2 rounded"
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[400px] flex-col sm:flex-row">
              {/* Left Column - Main Categories */}
              <div className="w-full sm:w-64 bg-gray-50 border-r-0 sm:border-r border-gray-200 border-b sm:border-b-0">
                <div className="py-2">
                  {categories.length > 0 && (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className={`group cursor-pointer border-l-4 ${
                          hoveredCategory === category.id 
                            ? 'bg-primary-500 text-white border-primary-600' 
                            : 'hover:bg-primary-100 hover:text-primary-600 border-transparent hover:border-primary-300'
                        } transition-all duration-200`}
                        onMouseEnter={() => handleCategoryHover(category.id)}
                      >
                        <Link
                          href={`/categories/${category.id}`}
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
                          {categoryHierarchy[category.id] && categoryHierarchy[category.id].length > 0 && (
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
                {hoveredCategory && categoryHierarchy[hoveredCategory] && categoryHierarchy[hoveredCategory].length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {categoryHierarchy[hoveredCategory].map((subcategory) => (
                      <div key={subcategory.id} className="space-y-3">
                        <div className="flex items-center space-x-2 border-b-2 border-primary-200 pb-2">
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
                            href={`/categories/${subcategory.id}`}
                            className="block text-sm text-gray-600 hover:text-primary-500 hover:bg-primary-50 px-2 py-1.5 rounded transition-colors duration-200 font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            {subcategory.name}
                          </Link>
                          {/* Render all child levels recursively */}
                          {renderCategoryLevel(subcategory.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MenuIcon className="h-10 w-10 text-primary-400" />
                      </div>
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
