-- Delivery Functions Migration
-- This migration creates helper functions for delivery calculations

-- Function to get delivery options for a product
CREATE OR REPLACE FUNCTION get_product_delivery_options(product_uuid UUID, delivery_city TEXT, delivery_country TEXT)
RETURNS TABLE (
  pickup_location_id UUID,
  pickup_location_name TEXT,
  pickup_city TEXT,
  delivery_method_id UUID,
  delivery_method_name TEXT,
  is_free_delivery BOOLEAN,
  delivery_price DECIMAL(10,2),
  estimated_min_days INTEGER,
  estimated_max_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id as pickup_location_id,
    pl.name as pickup_location_name,
    pl.city as pickup_city,
    dm.id as delivery_method_id,
    dm.name as delivery_method_name,
    pdo.is_free_delivery,
    CASE 
      WHEN pdo.is_free_delivery THEN 0.00
      ELSE dr.price
    END as delivery_price,
    dr.estimated_min_days,
    dr.estimated_max_days
  FROM product_delivery_options pdo
  JOIN pickup_locations pl ON pdo.pickup_location_id = pl.id
  JOIN delivery_methods dm ON pdo.delivery_method_id = dm.id
  LEFT JOIN delivery_rates dr ON (
    pl.city = dr.pickup_city 
    AND delivery_city = dr.delivery_city 
    AND dm.id = dr.delivery_method_id
    AND dr.is_active = true
  )
  WHERE pdo.product_id = product_uuid
    AND pl.is_active = true
    AND dm.is_active = true
    AND EXISTS (
      SELECT 1 FROM product_delivery_zones pdz 
      WHERE pdz.product_id = product_uuid 
        AND pdz.city = delivery_city 
        AND pdz.country = delivery_country 
        AND pdz.is_allowed = true
    )
  ORDER BY delivery_price ASC, dr.estimated_min_days ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a product can be delivered to a specific city
CREATE OR REPLACE FUNCTION can_deliver_to_city(product_uuid UUID, delivery_city TEXT, delivery_country TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM product_delivery_zones pdz 
    WHERE pdz.product_id = product_uuid 
      AND pdz.city = delivery_city 
      AND pdz.country = delivery_country 
      AND pdz.is_allowed = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get the cheapest delivery option for a product
CREATE OR REPLACE FUNCTION get_cheapest_delivery_option(product_uuid UUID, delivery_city TEXT, delivery_country TEXT)
RETURNS TABLE (
  pickup_location_id UUID,
  pickup_location_name TEXT,
  pickup_city TEXT,
  delivery_method_id UUID,
  delivery_method_name TEXT,
  is_free_delivery BOOLEAN,
  delivery_price DECIMAL(10,2),
  estimated_min_days INTEGER,
  estimated_max_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM get_product_delivery_options(product_uuid, delivery_city, delivery_country)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get all available delivery methods for a product
CREATE OR REPLACE FUNCTION get_product_delivery_methods(product_uuid UUID)
RETURNS TABLE (
  delivery_method_id UUID,
  delivery_method_name TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    dm.id as delivery_method_id,
    dm.name as delivery_method_name,
    dm.description
  FROM product_delivery_options pdo
  JOIN delivery_methods dm ON pdo.delivery_method_id = dm.id
  WHERE pdo.product_id = product_uuid
    AND dm.is_active = true
  ORDER BY dm.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all pickup locations for a product
CREATE OR REPLACE FUNCTION get_product_pickup_locations(product_uuid UUID)
RETURNS TABLE (
  pickup_location_id UUID,
  pickup_location_name TEXT,
  pickup_city TEXT,
  pickup_country TEXT,
  address_line TEXT,
  contact_phone TEXT,
  contact_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    pl.id as pickup_location_id,
    pl.name as pickup_location_name,
    pl.city as pickup_city,
    pl.country as pickup_country,
    pl.address_line,
    pl.contact_phone,
    pl.contact_email
  FROM product_delivery_options pdo
  JOIN pickup_locations pl ON pdo.pickup_location_id = pl.id
  WHERE pdo.product_id = product_uuid
    AND pl.is_active = true
  ORDER BY pl.city, pl.name;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate delivery cost and time for a specific combination
CREATE OR REPLACE FUNCTION calculate_delivery_cost(
  product_uuid UUID,
  pickup_location_uuid UUID,
  delivery_method_uuid UUID,
  delivery_city TEXT,
  delivery_country TEXT
)
RETURNS TABLE (
  is_available BOOLEAN,
  is_free_delivery BOOLEAN,
  delivery_price DECIMAL(10,2),
  estimated_min_days INTEGER,
  estimated_max_days INTEGER,
  error_message TEXT
) AS $$
DECLARE
  delivery_option RECORD;
  delivery_rate RECORD;
BEGIN
  -- Check if the product can be delivered to this city
  IF NOT can_deliver_to_city(product_uuid, delivery_city, delivery_country) THEN
    RETURN QUERY SELECT false, false, 0.00, 0, 0, 'Product cannot be delivered to this city';
    RETURN;
  END IF;

  -- Get the delivery option
  SELECT * INTO delivery_option
  FROM product_delivery_options pdo
  WHERE pdo.product_id = product_uuid
    AND pdo.pickup_location_id = pickup_location_uuid
    AND pdo.delivery_method_id = delivery_method_uuid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0.00, 0, 0, 'Delivery option not available for this product';
    RETURN;
  END IF;

  -- If free delivery, return zero cost
  IF delivery_option.is_free_delivery THEN
    RETURN QUERY SELECT true, true, 0.00, 1, 1, NULL;
    RETURN;
  END IF;

  -- Get delivery rate
  SELECT * INTO delivery_rate
  FROM delivery_rates dr
  JOIN pickup_locations pl ON pl.city = dr.pickup_city
  WHERE pl.id = pickup_location_uuid
    AND dr.delivery_city = delivery_city
    AND dr.delivery_method_id = delivery_method_uuid
    AND dr.is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0.00, 0, 0, 'No delivery rate found for this route';
    RETURN;
  END IF;

  -- Return the calculated cost and time
  RETURN QUERY SELECT 
    true, 
    false, 
    delivery_rate.price, 
    delivery_rate.estimated_min_days, 
    delivery_rate.estimated_max_days, 
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get delivery summary for checkout
CREATE OR REPLACE FUNCTION get_delivery_summary(
  product_uuid UUID,
  delivery_city TEXT,
  delivery_country TEXT
)
RETURNS TABLE (
  can_deliver BOOLEAN,
  has_free_delivery BOOLEAN,
  cheapest_price DECIMAL(10,2),
  fastest_days INTEGER,
  total_options INTEGER,
  error_message TEXT
) AS $$
DECLARE
  delivery_options RECORD;
  min_price DECIMAL(10,2) := NULL;
  min_days INTEGER := NULL;
  option_count INTEGER := 0;
  has_free BOOLEAN := false;
BEGIN
  -- Check if product can be delivered
  IF NOT can_deliver_to_city(product_uuid, delivery_city, delivery_country) THEN
    RETURN QUERY SELECT false, false, 0.00, 0, 0, 'Product cannot be delivered to this city';
    RETURN;
  END IF;

  -- Get all delivery options
  FOR delivery_options IN 
    SELECT * FROM get_product_delivery_options(product_uuid, delivery_city, delivery_country)
  LOOP
    option_count := option_count + 1;
    
    -- Track free delivery
    IF delivery_options.is_free_delivery THEN
      has_free := true;
    END IF;
    
    -- Track cheapest price
    IF min_price IS NULL OR delivery_options.delivery_price < min_price THEN
      min_price := delivery_options.delivery_price;
    END IF;
    
    -- Track fastest delivery
    IF min_days IS NULL OR delivery_options.estimated_min_days < min_days THEN
      min_days := delivery_options.estimated_min_days;
    END IF;
  END LOOP;

  IF option_count = 0 THEN
    RETURN QUERY SELECT false, false, 0.00, 0, 0, 'No delivery options available';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, has_free, COALESCE(min_price, 0.00), COALESCE(min_days, 0), option_count, NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments for the functions
COMMENT ON FUNCTION get_product_delivery_options IS 'Returns all available delivery options for a product to a specific city';
COMMENT ON FUNCTION can_deliver_to_city IS 'Checks if a product can be delivered to a specific city';
COMMENT ON FUNCTION get_cheapest_delivery_option IS 'Returns the cheapest delivery option for a product to a specific city';
COMMENT ON FUNCTION get_product_delivery_methods IS 'Returns all delivery methods available for a product';
COMMENT ON FUNCTION get_product_pickup_locations IS 'Returns all pickup locations available for a product';
COMMENT ON FUNCTION calculate_delivery_cost IS 'Calculates delivery cost and time for a specific product, pickup location, and delivery method combination';
COMMENT ON FUNCTION get_delivery_summary IS 'Returns a summary of delivery options for checkout display';




