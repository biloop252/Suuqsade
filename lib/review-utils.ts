import { supabase } from './supabase';

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

/**
 * Fetch review statistics for a single product
 */
export async function getProductReviewStats(productId: string): Promise<ReviewStats> {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);

    if (error) {
      console.error('Error fetching review stats:', error);
      return { averageRating: 0, totalReviews: 0 };
    }

    if (!reviews || reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      averageRating,
      totalReviews: reviews.length
    };
  } catch (error) {
    console.error('Error fetching product review stats:', error);
    return { averageRating: 0, totalReviews: 0 };
  }
}

/**
 * Fetch review statistics for multiple products in batch
 */
export async function getBatchProductReviewStats(productIds: string[]): Promise<Record<string, ReviewStats>> {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('product_id, rating')
      .in('product_id', productIds)
      .eq('is_approved', true);

    if (error) {
      console.error('Error fetching batch review stats:', error);
      return {};
    }

    const statsMap: Record<string, ReviewStats> = {};

    // Initialize all products with zero stats
    productIds.forEach(id => {
      statsMap[id] = { averageRating: 0, totalReviews: 0 };
    });

    if (!reviews || reviews.length === 0) {
      return statsMap;
    }

    // Group reviews by product_id
    const reviewsByProduct: Record<string, number[]> = {};
    reviews.forEach(review => {
      if (!reviewsByProduct[review.product_id]) {
        reviewsByProduct[review.product_id] = [];
      }
      reviewsByProduct[review.product_id].push(review.rating);
    });

    // Calculate stats for each product
    Object.entries(reviewsByProduct).forEach(([productId, ratings]) => {
      const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating = totalRating / ratings.length;

      statsMap[productId] = {
        averageRating,
        totalReviews: ratings.length
      };
    });

    return statsMap;
  } catch (error) {
    console.error('Error fetching batch review stats:', error);
    return {};
  }
}

/**
 * Format rating display text
 */
export function formatRatingText(averageRating: number, totalReviews: number): string {
  if (totalReviews === 0) {
    return 'No reviews yet';
  }
  
  return `(${averageRating.toFixed(1)}) • ${totalReviews} review${totalReviews !== 1 ? 's' : ''}`;
}

/**
 * Get star display configuration
 */
export function getStarDisplay(averageRating: number): {
  filledStars: number;
  hasRating: boolean;
} {
  if (averageRating === 0) {
    return { filledStars: 0, hasRating: false };
  }
  
  return { 
    filledStars: Math.round(averageRating), 
    hasRating: true 
  };
}
