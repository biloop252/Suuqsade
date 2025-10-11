'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Brand, ProductWithDetails } from '@/types/database';
import { ProductDiscount, getBatchProductDiscounts, calculateBestDiscount } from '@/lib/discount-utils';
import ProductCard from '@/components/products/ProductCard';
import { ArrowLeftIcon, PackageIcon, FilterIcon, SortAscIcon, SortDescIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import PromotionalBanner from '@/components/promotional/PromotionalBanner';
import SidebarPromotional from '@/components/promotional/SidebarPromotional';

export default function BrandPage() {
  const params = useParams();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 1000 },
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
    if (params.slug) {
      fetchBrandAndProducts();
    }
  }, [params.slug]);

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSorting();
  }, [allProducts, filters, sortBy, sortOrder]);

  const applyFiltersAndSorting = () => {
    let filteredProducts = [...allProducts];

    // Apply price filter
    filteredProducts = filteredProducts.filter(product => {
      const price = product.sale_price || product.price;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Apply in stock filter
    if (filters.inStock) {
      filteredProducts = filteredProducts.filter(product => product.stock_quantity > 0);
    }

    // Apply on sale filter
    if (filters.onSale) {
      filteredProducts = filteredProducts.filter(product => 
        product.sale_price && product.sale_price < product.price
      );
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.sale_price || a.price;
          bValue = b.sale_price || b.price;
          break;
        case 'rating':
          aValue = 4.2; // Placeholder rating
          bValue = 4.2;
          break;
        case 'newest':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
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

  const fetchBrandAndProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch brand details
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single();

      if (brandError) {
        console.error('Error fetching brand:', brandError);
        return;
      }

      setBrand(brandData);

      // Fetch products for this brand
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          vendor:vendor_profiles(business_name, city, country, logo_url),
          images:product_images(*),
          variants:product_variants(*),
          reviews:reviews(*)
        `)
        .eq('brand_id', brandData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        const products = productsData || [];
        setAllProducts(products);
        
        // Set price range filter based on products
        if (products.length > 0) {
          const prices = products.map(p => p.sale_price || p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setFilters(prev => ({
            ...prev,
            priceRange: { min: Math.floor(minPrice), max: Math.ceil(maxPrice) }
          }));
          
          // Fetch discounts for all products in batch
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

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 1000 },
      inStock: false,
      onSale: false
    });
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <PackageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brand not found</h3>
            <p className="text-gray-600 mb-4">The brand you're looking for doesn't exist.</p>
            <Link
              href="/brands"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Brands
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link href="/brands" className="hover:text-primary-600">Brands</Link>
          <span>/</span>
          <span className="text-gray-900">{brand.name}</span>
        </nav>

        {/* Brand Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <PackageIcon className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{brand.name}</h1>
              {brand.description && (
                <p className="text-gray-600 text-lg">{brand.description}</p>
              )}
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span>{products.length} products</span>
                <span>•</span>
                <span>Est. {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Promotional Banner */}
        <PromotionalBanner />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceRange.max}
                    onChange={(e) => handleFilterChange('priceRange', {
                      ...filters.priceRange,
                      max: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${filters.priceRange.min}</span>
                    <span>${filters.priceRange.max}</span>
                  </div>
                </div>
              </div>

              {/* In Stock Filter */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>

              {/* On Sale Filter */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={(e) => handleFilterChange('onSale', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">On Sale</span>
                </label>
              </div>
            </div>

            {/* Sidebar Promotional */}
            <SidebarPromotional />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <span className="text-sm text-gray-600">
                  {products.length} products found
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="rating">Rating</option>
                    <option value="newest">Newest</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {sortOrder === 'asc' ? (
                      <SortAscIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <SortDescIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* View Mode */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <PackageIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <FilterIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <PackageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters to see more products.</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
