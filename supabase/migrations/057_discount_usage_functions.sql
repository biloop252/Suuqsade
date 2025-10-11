-- Functions for incrementing discount and coupon usage counts

-- Function to increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment discount usage count
CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discounts 
  SET used_count = used_count + 1 
  WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;
