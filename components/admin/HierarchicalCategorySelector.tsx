'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

interface HierarchicalCategorySelectorProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  excludeId?: string; // ID to exclude from selection (for editing)
  placeholder?: string;
}

export default function HierarchicalCategorySelector({
  value,
  onChange,
  excludeId,
  placeholder = "Select parent category"
}: HierarchicalCategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      // Build tree structure
      const categoryMap = new Map<string, CategoryWithChildren>();
      const rootCategories: CategoryWithChildren[] = [];

      data?.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      data?.forEach(category => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children?.push(categoryMap.get(category.id)!);
          }
        } else {
          rootCategories.push(categoryMap.get(category.id)!);
        }
      });

      setCategories(rootCategories);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getSelectedCategoryName = () => {
    if (!value) return placeholder;
    
    const findCategory = (categoryList: CategoryWithChildren[], id: string): Category | null => {
      for (const category of categoryList) {
        if (category.id === id) return category;
        if (category.children) {
          const found = findCategory(category.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedCategory = findCategory(categories, value);
    return selectedCategory ? selectedCategory.name : placeholder;
  };

  const renderCategoryOption = (category: CategoryWithChildren, level = 0) => {
    const isExcluded = excludeId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer ${
            isExcluded ? 'opacity-50 cursor-not-allowed' : ''
          } ${level > 0 ? 'ml-6' : ''}`}
          onClick={() => {
            if (!isExcluded) {
              onChange(category.id);
              setIsOpen(false);
            }
          }}
        >
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <span className={`text-sm ${isExcluded ? 'text-gray-400' : 'text-gray-900'}`}>
              {category.name}
            </span>
            {isExcluded && (
              <span className="text-xs text-gray-400">(Current category)</span>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children?.map(child => renderCategoryOption(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
      >
        <span className="block truncate text-gray-900">
          {getSelectedCategoryName()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              <div
                className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
              >
                <span className="text-sm text-gray-900">No parent (root category)</span>
              </div>
              {categories.map(category => renderCategoryOption(category))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}






