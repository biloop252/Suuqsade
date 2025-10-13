'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Brand } from '@/types/database';
import Link from 'next/link';
import { StarIcon } from 'lucide-react';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching brands:', error);
      } else {
        setBrands(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Brands</h1>
          <p className="text-gray-600">Discover products from your favorite brands</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors duration-300">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <StarIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-300 mb-2">
                      {brand.name}
                    </h3>
                    {brand.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {brand.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && brands.length === 0 && (
          <div className="text-center py-12">
            <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
            <p className="text-gray-600">Brands will appear here once they are added.</p>
          </div>
        )}
      </div>
    </div>
  );
}











































