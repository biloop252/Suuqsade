-- Review System Setup
-- This migration sets up the review system with proper RLS policies and sample data

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews (only if they don't exist)

-- Users can view all approved reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can view approved reviews'
  ) THEN
    CREATE POLICY "Users can view approved reviews" ON reviews
      FOR SELECT USING (is_approved = true);
  END IF;
END $$;

-- Users can view their own reviews (approved or not)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can view their own reviews'
  ) THEN
    CREATE POLICY "Users can view their own reviews" ON reviews
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert their own reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can insert their own reviews'
  ) THEN
    CREATE POLICY "Users can insert their own reviews" ON reviews
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can update their own reviews'
  ) THEN
    CREATE POLICY "Users can update their own reviews" ON reviews
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete their own reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can delete their own reviews'
  ) THEN
    CREATE POLICY "Users can delete their own reviews" ON reviews
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can view all reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Admins can view all reviews'
  ) THEN
    CREATE POLICY "Admins can view all reviews" ON reviews
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Admins can update all reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Admins can update all reviews'
  ) THEN
    CREATE POLICY "Admins can update all reviews" ON reviews
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Admins can delete all reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Admins can delete all reviews'
  ) THEN
    CREATE POLICY "Admins can delete all reviews" ON reviews
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Create function to calculate average rating for a product
CREATE OR REPLACE FUNCTION calculate_product_rating(product_id UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating)::DECIMAL, 2) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM reviews 
  WHERE reviews.product_id = calculate_product_rating.product_id 
  AND is_approved = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get review statistics
CREATE OR REPLACE FUNCTION get_review_statistics(product_id UUID)
RETURNS TABLE (
  rating INTEGER,
  count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.rating,
    COUNT(*)::INTEGER
  FROM reviews r
  WHERE r.product_id = get_review_statistics.product_id 
  AND r.is_approved = true
  GROUP BY r.rating
  ORDER BY r.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_reviews_updated_at' 
    AND tgrelid = 'reviews'::regclass
  ) THEN
    CREATE TRIGGER update_reviews_updated_at 
      BEFORE UPDATE ON reviews 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Add comments to document the table
COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'Whether the reviewer purchased the product';
COMMENT ON COLUMN reviews.is_approved IS 'Whether the review has been approved by admin';
