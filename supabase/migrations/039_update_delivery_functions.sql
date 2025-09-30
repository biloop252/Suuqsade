-- Update Delivery Functions Migration
-- This migration updates the delivery functions to work with the new product_delivery_options structure

-- Drop existing functions
DROP FUNCTION IF EXISTS get_product_delivery_options(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_cheapest_delivery_option(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_product_delivery_methods(UUID);
DROP FUNCTION IF EXISTS get_product_pickup_locations(UUID);
DROP FUNCTION IF EXISTS get_delivery_summary(UUID, TEXT, TEXT);

-- Updated function to get delivery options for a product
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

-- Updated function to get the cheapest delivery option for a product
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

-- Updated function to get all available delivery methods for a product
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
  JOIN delivery_rates dr ON pdo.delivery_rate_id = dr.id
  JOIN delivery_methods dm ON dr.delivery_method_id = dm.id
  WHERE pdo.product_id = product_uuid
    AND dm.is_active = true
    AND dr.is_active = true
  ORDER BY dm.name;
END;
$$ LANGUAGE plpgsql;

-- Updated function to get all pickup locations for a product
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
  JOIN delivery_rates dr ON pdo.delivery_rate_id = dr.id
  JOIN pickup_locations pl ON pl.city = dr.pickup_city
  WHERE pdo.product_id = product_uuid
    AND pl.is_active = true
    AND dr.is_active = true
  ORDER BY pl.city, pl.name;
END;
$$ LANGUAGE plpgsql;

-- Updated function to get delivery summary
CREATE OR REPLACE FUNCTION get_delivery_summary(product_uuid UUID, delivery_city TEXT, delivery_country TEXT)
RETURNS TABLE (
  can_deliver BOOLEAN,
  has_free_delivery BOOLEAN,
  cheapest_price DECIMAL(10,2),
  fastest_days INTEGER,
  total_options INTEGER,
  error_message TEXT
) AS $$
DECLARE
  delivery_options_count INTEGER;
  free_delivery_exists BOOLEAN;
  min_price DECIMAL(10,2);
  min_days INTEGER;
BEGIN
  -- Check if delivery is allowed to this city
  IF NOT EXISTS (
    SELECT 1 FROM product_delivery_zones pdz 
    WHERE pdz.product_id = product_uuid 
      AND pdz.city = delivery_city 
      AND pdz.country = delivery_country 
      AND pdz.is_allowed = true
  ) THEN
    RETURN QUERY SELECT false, false, 0.00, 0, 0, 'Delivery not allowed to this location'::TEXT;
    RETURN;
  END IF;

  -- Get delivery options count
  SELECT COUNT(*) INTO delivery_options_count
  FROM get_product_delivery_options(product_uuid, delivery_city, delivery_country);

  -- Check if any free delivery options exist
  SELECT EXISTS (
    SELECT 1 FROM get_product_delivery_options(product_uuid, delivery_city, delivery_country)
    WHERE is_free_delivery = true
  ) INTO free_delivery_exists;

  -- Get cheapest price and fastest delivery
  SELECT 
    MIN(CASE WHEN is_free_delivery THEN 0.00 ELSE delivery_price END),
    MIN(estimated_min_days)
  INTO min_price, min_days
  FROM get_product_delivery_options(product_uuid, delivery_city, delivery_country);

  -- Return summary
  IF delivery_options_count > 0 THEN
    RETURN QUERY SELECT 
      true, 
      free_delivery_exists, 
      COALESCE(min_price, 0.00), 
      COALESCE(min_days, 0), 
      delivery_options_count,
      NULL::TEXT;
  ELSE
    RETURN QUERY SELECT 
      false, 
      false, 
      0.00, 
      0, 
      0,
      'No delivery options available'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_product_delivery_options TO authenticated;
GRANT EXECUTE ON FUNCTION get_cheapest_delivery_option TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_delivery_methods TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_pickup_locations TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivery_summary TO authenticated;
