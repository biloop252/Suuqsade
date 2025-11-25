'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Category, ProductWithDetails, Brand } from '@/types/database';
import { ProductDiscount, getBatchProductDiscounts, calculateBestDiscount } from '@/lib/discount-utils';
import ProductCard from '@/components/products/ProductCard';
import { ArrowLeft, Package, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import Link from 'next/link';
import PromotionalBanner from '@/components/promotional/PromotionalBanner';
import SidebarPromotional from '@/components/promotional/SidebarPromotional';

export default function CategoryPage() {
  const params = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 1000 },
    brands: [] as string[],
    inStock: false,
    onSale: false
  });
  
  // Sort state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [productDiscounts, setProductDiscounts] = useState<Record<string, {
    discounts: ProductDiscount[];
    discountInfo: { final_price: number; discount_amount: number; has_discount: boolean };
  }>>({});

  useEffect(() => {
    if (params.id) {
      fetchCategoryAndProducts();
    }
  }, [params.id]);

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSorting();
  }, [allProducts, filters, sortBy, sortOrder]);

  const applyFiltersAndSorting = () => {
    let filteredProducts = [...allProducts];

    // Apply price filter
    filteredProducts = filteredProducts.filter(product => {
      const price = product.price || 0;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Apply brand filter
    if (filters.brands.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        product.brand && filters.brands.includes(product.brand.id)
      );
    }

    // Apply stock filter
    if (filters.inStock) {
      filteredProducts = filteredProducts.filter(product => 
        product.stock_quantity && product.stock_quantity > 0
      );
    }

    // Apply sale filter
    if (filters.onSale) {
      filteredProducts = filteredProducts.filter(product => {
        const discountInfo = productDiscounts[product.id];
        return discountInfo?.discountInfo?.has_discount || false;
      });
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'price':
          const aDiscountInfo = productDiscounts[a.id];
          const bDiscountInfo = productDiscounts[b.id];
          aValue = aDiscountInfo?.discountInfo?.final_price || a.price || 0;
          bValue = bDiscountInfo?.discountInfo?.final_price || b.price || 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'newest':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'rating':
          // For now, sort by name since we don't have review stats in this context
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setProducts(filteredProducts);
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 1000 },
      brands: [],
      inStock: false,
      onSale: false
    });
  };

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch category by ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .eq('is_active', true)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        return;
      }

      setCategory(categoryData);

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', categoryData.id)
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (subcategoriesError) {
        console.error('Error fetching subcategories:', subcategoriesError);
      }

      // Fetch products in this category and its subcategories
      const categoryIds = [categoryData.id];
      if (subcategoriesData) {
        categoryIds.push(...subcategoriesData.map(sub => sub.id));
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .order('name');

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        const products = productsData || [];
        setAllProducts(products);
        setProducts(products);
        
        // Extract unique brands from products
        const uniqueBrands = products
          .map(p => p.brand)
          .filter((brand, index, self) => brand && self.findIndex(b => b?.id === brand.id) === index)
          .filter(Boolean) as Brand[];
        setBrands(uniqueBrands);
        
        // Fetch discounts for all products in batch
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
          <Link href="/categories" className="btn-primary">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Page Promotional Banner */}
        <div className="mb-8">
          <PromotionalBanner 
            position="category_page" 
            className="h-48"
            showTitle={true}
            showDescription={true}
          />
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-primary-600">Categories</Link>
          <span>/</span>
          <span className="text-gray-900">{category.name}</span>
        </nav>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Filters</span>
            {showFilters ? (
              <X className="h-4 w-4 text-gray-600" />
            ) : (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                {(filters.brands.length > 0 ? 1 : 0) + 
                 (filters.inStock ? 1 : 0) + 
                 (filters.onSale ? 1 : 0) + 
                 ((filters.priceRange.min !== 0 || filters.priceRange.max !== 1000) ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Products Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  Clear All
                </button>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, min: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, max: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Filter */}
              {brands.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Brands</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFilter('brands', [...filters.brands, brand.id]);
                            } else {
                              updateFilter('brands', filters.brands.filter(id => id !== brand.id));
                            }
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Availability</h4>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => updateFilter('inStock', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>

              {/* Sale Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Deals</h4>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={(e) => updateFilter('onSale', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">On Sale</span>
                </label>
              </div>
            </div>
            
            {/* Sidebar Promotional Media */}
            <div className="mt-6">
              <SidebarPromotional maxItems={2} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Products Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  Products in {category.name}
                </h2>
                <span className="text-sm text-gray-600">
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Sort Controls */}
              <div className="flex items-center space-x-4">
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

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                  : 'space-y-4'
              }>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    discountData={productDiscounts[product.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more products.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}







