-- Discount and Coupon System Migration
-- This migration creates tables for managing discounts and coupons

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for discount system
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
CREATE TYPE discount_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE coupon_status AS ENUM ('active', 'inactive', 'expired', 'used_up');

-- Discounts table (for automatic discounts)
CREATE TABLE discounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  type discount_type NOT NULL,
  value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed amount
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount_amount DECIMAL(10,2), -- for percentage discounts
  usage_limit INTEGER, -- total usage limit across all users
  usage_limit_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  status discount_status DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Vendor who created this discount
  is_global BOOLEAN DEFAULT false, -- Global discounts vs vendor-specific
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons table (for manual coupon codes)
CREATE TABLE coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type discount_type NOT NULL,
  value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed amount
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount_amount DECIMAL(10,2), -- for percentage discounts
  usage_limit INTEGER, -- total usage limit across all users
  usage_limit_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  status coupon_status DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Vendor who created this coupon
  is_global BOOLEAN DEFAULT false, -- Global coupons vs vendor-specific
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discount/Coupon usage tracking
CREATE TABLE discount_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor-specific product discounts
CREATE TABLE vendor_product_discounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor-specific category discounts
CREATE TABLE vendor_category_discounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor-specific brand discounts
CREATE TABLE vendor_brand_discounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-specific coupons (for targeted promotions)
CREATE TABLE user_coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_status ON discounts(status);
CREATE INDEX idx_discounts_dates ON discounts(start_date, end_date);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_dates ON coupons(start_date, end_date);
CREATE INDEX idx_discount_usage_user ON discount_usage(user_id);
CREATE INDEX idx_discount_usage_order ON discount_usage(order_id);
CREATE INDEX idx_vendor_product_discounts_vendor ON vendor_product_discounts(vendor_id);
CREATE INDEX idx_vendor_product_discounts_product ON vendor_product_discounts(product_id);
CREATE INDEX idx_vendor_category_discounts_vendor ON vendor_category_discounts(vendor_id);
CREATE INDEX idx_vendor_category_discounts_category ON vendor_category_discounts(category_id);
CREATE INDEX idx_vendor_brand_discounts_vendor ON vendor_brand_discounts(vendor_id);
CREATE INDEX idx_vendor_brand_discounts_brand ON vendor_brand_discounts(brand_id);
CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);

-- Add triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to check if discount/coupon is valid
CREATE OR REPLACE FUNCTION is_discount_valid(
  p_discount_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_order_amount DECIMAL DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
  discount_record RECORD;
  user_usage_count INTEGER;
BEGIN
  -- Get discount details
  SELECT * INTO discount_record FROM discounts WHERE id = p_discount_id;
  
  -- Check if discount exists and is active
  IF NOT FOUND OR NOT discount_record.is_active OR discount_record.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  -- Check date validity
  IF discount_record.start_date > NOW() OR 
     (discount_record.end_date IS NOT NULL AND discount_record.end_date < NOW()) THEN
    RETURN FALSE;
  END IF;
  
  -- Check usage limits
  IF discount_record.usage_limit IS NOT NULL AND 
     discount_record.used_count >= discount_record.usage_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Check minimum order amount
  IF discount_record.minimum_order_amount > 0 AND 
     p_order_amount < discount_record.minimum_order_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Check per-user usage limit
  IF p_user_id IS NOT NULL AND discount_record.usage_limit_per_user > 0 THEN
    SELECT COUNT(*) INTO user_usage_count 
    FROM discount_usage 
    WHERE user_id = p_user_id AND discount_id = p_discount_id;
    
    IF user_usage_count >= discount_record.usage_limit_per_user THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if vendor discount is valid for specific products/categories
CREATE OR REPLACE FUNCTION is_vendor_discount_valid(
  p_discount_id UUID,
  p_vendor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_order_amount DECIMAL DEFAULT 0,
  p_product_ids UUID[] DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  discount_record RECORD;
  user_usage_count INTEGER;
  has_valid_product BOOLEAN := FALSE;
  has_valid_category BOOLEAN := FALSE;
BEGIN
  -- Get discount details
  SELECT * INTO discount_record FROM discounts WHERE id = p_discount_id;
  
  -- Check if discount exists and is active
  IF NOT FOUND OR NOT discount_record.is_active OR discount_record.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if discount belongs to vendor or is global
  IF discount_record.vendor_id IS NOT NULL AND discount_record.vendor_id != p_vendor_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check date validity
  IF discount_record.start_date > NOW() OR 
     (discount_record.end_date IS NOT NULL AND discount_record.end_date < NOW()) THEN
    RETURN FALSE;
  END IF;
  
  -- Check usage limits
  IF discount_record.usage_limit IS NOT NULL AND 
     discount_record.used_count >= discount_record.usage_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Check minimum order amount
  IF discount_record.minimum_order_amount > 0 AND 
     p_order_amount < discount_record.minimum_order_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Check per-user usage limit
  IF p_user_id IS NOT NULL AND discount_record.usage_limit_per_user > 0 THEN
    SELECT COUNT(*) INTO user_usage_count 
    FROM discount_usage 
    WHERE user_id = p_user_id AND discount_id = p_discount_id;
    
    IF user_usage_count >= discount_record.usage_limit_per_user THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check if discount applies to any of the products/categories
  IF p_product_ids IS NOT NULL AND array_length(p_product_ids, 1) > 0 THEN
    SELECT EXISTS(
      SELECT 1 FROM vendor_product_discounts 
      WHERE discount_id = p_discount_id 
      AND vendor_id = p_vendor_id 
      AND product_id = ANY(p_product_ids)
    ) INTO has_valid_product;
  END IF;
  
  IF p_category_ids IS NOT NULL AND array_length(p_category_ids, 1) > 0 THEN
    SELECT EXISTS(
      SELECT 1 FROM vendor_category_discounts 
      WHERE discount_id = p_discount_id 
      AND vendor_id = p_vendor_id 
      AND category_id = ANY(p_category_ids)
    ) INTO has_valid_category;
  END IF;
  
  -- If discount is global, it applies to all products
  IF discount_record.is_global THEN
    RETURN TRUE;
  END IF;
  
  -- Check if discount applies to any of the specified products/categories
  RETURN has_valid_product OR has_valid_category;
END;
$$ LANGUAGE plpgsql;
