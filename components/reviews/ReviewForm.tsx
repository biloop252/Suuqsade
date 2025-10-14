'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { Review } from '@/types/database';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  productName: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
  existingReview?: Review;
}

export default function ReviewForm({ 
  productId, 
  productName, 
  onReviewSubmitted, 
  onCancel,
  existingReview 
}: ReviewFormProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showError('Authentication Required', 'You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      showError('Rating Required', 'Please select a rating');
      return;
    }

    if (!title.trim()) {
      showError('Title Required', 'Please enter a review title');
      return;
    }

    if (!comment.trim()) {
      showError('Comment Required', 'Please enter a review comment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user has purchased this product
      const { data: orders, error: ordersError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          orders!inner(
            id,
            user_id,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'delivered');

      if (ordersError) {
        console.error('Error checking purchase history:', ordersError);
      }

      const isVerifiedPurchase = orders && orders.length > 0;

      if (existingReview) {
        // Update existing review
        const { error: updateError } = await supabase
          .from('reviews')
          .update({
            rating,
            title: title.trim(),
            comment: comment.trim(),
            is_verified_purchase: isVerifiedPurchase,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReview.id);

        if (updateError) {
          throw updateError;
        }

        showSuccess(
          'Review Updated!',
          `Your review for ${productName} has been updated successfully`
        );
      } else {
        // Create new review
        const { error: insertError } = await supabase
          .from('reviews')
          .insert({
            product_id: productId,
            user_id: user.id,
            rating,
            title: title.trim(),
            comment: comment.trim(),
            is_verified_purchase: isVerifiedPurchase,
            is_approved: true // Auto-approve for now, can be changed to false for moderation
          });

        if (insertError) {
          throw insertError;
        }

        showSuccess(
          'Review Submitted!',
          `Thank you for reviewing ${productName}! Your review has been submitted successfully`
        );
      }

      onReviewSubmitted();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      showError(
        'Review Submission Failed',
        error.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 && `${rating} out of 5 stars`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {existingReview ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <p className="text-sm text-gray-600">
          Share your experience with {productName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          {renderStars()}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your review a title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={100}
          />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about your experience with this product..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/1000 characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
