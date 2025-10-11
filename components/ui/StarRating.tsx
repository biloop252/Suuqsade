'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({ 
  rating, 
  size = 'md', 
  showText = false, 
  interactive = false,
  onRatingChange,
  className = ''
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={interactive ? 'focus:outline-none' : 'cursor-default'}
          onClick={() => handleStarClick(star)}
          disabled={!interactive}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } ${interactive ? 'hover:text-yellow-400' : ''}`}
          />
        </button>
      ))}
      {showText && (
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating} out of 5 stars` : 'No rating'}
        </span>
      )}
    </div>
  );
}
