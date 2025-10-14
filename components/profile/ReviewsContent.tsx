'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Review } from '@/types/database';
import { StarIcon, PencilIcon, TrashIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';

interface ReviewWithProduct extends Review {
  product: {
    id: string;
    name: string;
    slug: string;
    images: Array<{
      image_url: string;
      alt_text?: string;
      is_primary: boolean;
    }>;
  };
}

export default function ReviewsContent() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserReviews();
    }
  }, [user]);

  const fetchUserReviews = async () => {
    try {
      // Only set loading if we don't have reviews yet
      if (reviews.length === 0) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          product:products(
            id,
            name,
            slug,
            images:product_images(
              image_url,
              alt_text,
              is_primary
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        throw error;
      }

      fetchUserReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProductImage = (product: ReviewWithProduct['product']) => {
    const primaryImage = product.images?.find(img => img.is_primary);
    return primaryImage || product.images?.[0];
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 bg-gray-200 rounded-md"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600 mb-4">You haven't written any product reviews.</p>
        <Link 
          href="/products" 
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          My Reviews ({reviews.length})
        </h2>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => {
          const productImage = getProductImage(review.product);
          
          return (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {productImage ? (
                    <img
                      src={productImage.image_url}
                      alt={productImage.alt_text || review.product.name}
                      className="h-16 w-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link
                          href={`/products/${review.product.slug}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {review.product.name}
                        </Link>
                        <ExternalLinkIcon className="h-3 w-3 text-gray-400" />
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Verified Purchase
                          </span>
                        )}
                      </div>

                      {review.title && (
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {review.title}
                        </h4>
                      )}

                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="text-gray-400 hover:text-gray-600"
                        title="View product"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete review"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
