'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';
import { ProductWithDetails } from '@/types/database';

interface FavoritesContextType {
  favorites: ProductWithDetails[];
  favoritesCount: number;
  isFavorite: (productId: string) => boolean;
  addToFavorites: (product: ProductWithDetails) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  toggleFavorite: (product: ProductWithDetails) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const favoritesCount = favorites.length;

  // Fetch favorites from database
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      // Only set loading if we don't have favorites yet
      if (favorites.length === 0) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
          *,
          product:products(
            *,
            category:categories(*),
            brand:brands(*),
            images:product_images(*),
            variants:product_variants(*)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
      } else {
        const favoriteProducts = data?.map(item => item.product).filter(Boolean) || [];
        setFavorites(favoriteProducts as ProductWithDetails[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if product is in favorites
  const isFavorite = (productId: string): boolean => {
    return favorites.some(fav => fav.id === productId);
  };

  // Add product to favorites
  const addToFavorites = async (product: ProductWithDetails) => {
    if (!user) {
      alert('Please sign in to add items to favorites');
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({
          user_id: user.id,
          product_id: product.id
        });

      if (error) {
        console.error('Error adding to favorites:', error);
        alert('Failed to add item to favorites');
      } else {
        setFavorites(prev => [...prev, product]);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add item to favorites');
    }
  };

  // Remove product from favorites
  const removeFromFavorites = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from favorites:', error);
        alert('Failed to remove item from favorites');
      } else {
        setFavorites(prev => prev.filter(fav => fav.id !== productId));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to remove item from favorites');
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (product: ProductWithDetails) => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  // Fetch favorites when user changes
  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const value: FavoritesContextType = {
    favorites,
    favoritesCount,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    loading
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
