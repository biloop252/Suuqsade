'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import { ProductWithDetails } from '@/types/database';

interface VendorProfile {
  id: string;
  business_name: string;
  business_description?: string;
  logo_url?: string;
  city?: string;
  country?: string;
}

export default function VendorPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'price'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (vendorId) {
      loadVendorAndProducts();
    }
  }, [vendorId]);

  const loadVendorAndProducts = async () => {
    try {
      setLoading(true);

      const { data: vendorData } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, logo_url, banner_url, city, country')
        .eq('id', vendorId)
        .single();

      setVendor(vendorData as VendorProfile);

      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*),
          variants:product_variants(*),
          reviews:reviews(*)
        `)
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts((productsData || []) as ProductWithDetails[]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!Number.isNaN(min)) list = list.filter(p => (p.price || 0) >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(max)) list = list.filter(p => (p.price || 0) <= max);
    }
    if (inStock) {
      list = list.filter(p => (p.stock_quantity || 0) > 0);
    }

    list.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortBy === 'price') return ((a.price || 0) - (b.price || 0)) * dir;
      // created_at fallback
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });

    return list;
  }, [products, minPrice, maxPrice, inStock, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Seller not found</h1>
          <Link href="/products" className="text-orange-600 hover:underline">Back to products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-5 gap-4 items-stretch">
            <div className="col-span-5 sm:col-span-1 flex items-center h-full">
              <div className="flex items-center gap-3">
                {vendor.logo_url ? (
                  <img src={vendor.logo_url} alt={vendor.business_name} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gray-100" />)
                }
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{vendor.business_name}</h1>
                  <p className="text-sm text-gray-600">{vendor.city}{vendor.city && vendor.country ? ', ' : ''}{vendor.country}</p>
                </div>
              </div>
            </div>
            <div className="col-span-5 sm:col-span-4 h-full">
              <div className="relative h-full min-h-[6rem] sm:min-h-[7rem] md:min-h-[8rem] rounded-lg overflow-hidden bg-gray-100">
                { (vendor as any).banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(vendor as any).banner_url as string} alt={`${vendor.business_name} banner`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No banner</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Price</label>
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Price</label>
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="9999" />
            </div>
            <div className="flex items-center gap-2">
              <input id="inStock" type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="inStock" className="text-sm text-gray-700">In stock</label>
            </div>
            <div className="flex items-center gap-2">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm">
                <option value="created_at">Newest</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}


