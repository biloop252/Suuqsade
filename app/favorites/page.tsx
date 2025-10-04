'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFavorites } from '@/lib/favorites-context';
import { ProductWithDetails } from '@/types/database';
import ProductCard from '@/components/products/ProductCard';
import { HeartIcon, GridIcon, ListIcon } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your favorites</h1>
          <p className="text-gray-600 mb-6">Please sign in to see your saved items.</p>
          <Link href="/auth/signin" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <HeartIcon className="h-8 w-8 text-red-500" />
            <h1 className="text-4xl font-extrabold text-gray-900">My Favorites</h1>
          </div>
          <p className="text-lg text-gray-600">
            {favorites.length === 0 
              ? "You haven't saved any items yet." 
              : `You have ${favorites.length} item${favorites.length !== 1 ? 's' : ''} in your favorites.`
            }
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <HeartIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No favorites yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start exploring our products and add items you love to your favorites. 
              You can easily find them here later!
            </p>
            <div className="space-x-4">
              <Link href="/products" className="btn-primary">
                Browse Products
              </Link>
              <Link href="/categories" className="btn-secondary">
                View Categories
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Showing {favorites.length} item{favorites.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <GridIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <ListIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {favorites.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

























