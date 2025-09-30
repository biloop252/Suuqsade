-- Fix Delivery Functions V2 Migration
-- This migration ensures the delivery functions work correctly with proper parameter handling

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_product_delivery_options(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_cheapest_delivery_option(UUID, TEXT, TEXT);

-- Create a simple test function first
CREATE OR REPLACE FUNCTION test_delivery_function()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Delivery functions are working!';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION test_delivery_function TO authenticated;

-- Create the main delivery function with proper error handling
CREATE OR REPLACE FUNCTION get_product_delivery_options(
  product_uuid UUID, 
  delivery_city TEXT, 
  delivery_country TEXT
)
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
  -- Validate input parameters
  IF product_uuid IS NULL THEN
    RAISE EXCEPTION 'product_uuid cannot be null';
  END IF;
  
  IF delivery_city IS NULL OR delivery_city = '' THEN
    RAISE EXCEPTION 'delivery_city cannot be null or empty';
  END IF;
  
  IF delivery_country IS NULL OR delivery_country = '' THEN
    RAISE EXCEPTION 'delivery_country cannot be null or empty';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(pl.id, '00000000-0000-0000-0000-000000000000'::uuid) as pickup_location_id,
    COALESCE(pl.name, 'Unknown Location') as pickup_location_name,
    dr.pickup_city,
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
  JOIN delivery_rates dr ON pdo.delivery_rate_id = dr.id
  JOIN delivery_methods dm ON dr.delivery_method_id = dm.id
  LEFT JOIN pickup_locations pl ON pl.city = dr.pickup_city AND pl.is_active = true
  WHERE pdo.product_id = product_uuid
    AND dr.delivery_city = delivery_city
    AND dm.is_active = true
    AND dr.is_active = true
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

-- Create the cheapest delivery option function
CREATE OR REPLACE FUNCTION get_cheapest_delivery_option(
  product_uuid UUID, 
  delivery_city TEXT, 
  delivery_country TEXT
)
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
  -- Validate input parameters
  IF product_uuid IS NULL THEN
    RAISE EXCEPTION 'product_uuid cannot be null';
  END IF;
  
  IF delivery_city IS NULL OR delivery_city = '' THEN
    RAISE EXCEPTION 'delivery_city cannot be null or empty';
  END IF;
  
  IF delivery_country IS NULL OR delivery_country = '' THEN
    RAISE EXCEPTION 'delivery_country cannot be null or empty';
  END IF;

  RETURN QUERY
  SELECT * FROM get_product_delivery_options(product_uuid, delivery_city, delivery_country)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_product_delivery_options TO authenticated;
GRANT EXECUTE ON FUNCTION get_cheapest_delivery_option TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_product_delivery_options IS 'Returns all available delivery options for a product to a specific city with proper error handling';
COMMENT ON FUNCTION get_cheapest_delivery_option IS 'Returns the cheapest delivery option for a product to a specific city with proper error handling';
COMMENT ON FUNCTION test_delivery_function IS 'Test function to verify RPC is working';
