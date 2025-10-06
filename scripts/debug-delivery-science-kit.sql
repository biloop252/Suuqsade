-- Debug script to check delivery options for Science Experiment Kit
-- Run this in Supabase SQL editor to debug the delivery calculation issue

-- First, let's find the Science Experiment Kit product
SELECT id, name, slug FROM products WHERE name ILIKE '%Science Experiment Kit%';

-- Check if the product has delivery options configured
SELECT 
  p.name as product_name,
  pdo.id as delivery_option_id,
  dr.pickup_city,
  dr.delivery_city,
  dm.name as delivery_method,
  dr.price,
  pdo.is_free_delivery
FROM products p
LEFT JOIN product_delivery_options pdo ON p.id = pdo.product_id
LEFT JOIN delivery_rates dr ON pdo.delivery_rate_id = dr.id
LEFT JOIN delivery_methods dm ON dr.delivery_method_id = dm.id
WHERE p.name ILIKE '%Science Experiment Kit%';

-- Check delivery zones for the product
SELECT 
  p.name as product_name,
  pdz.city,
  pdz.country,
  pdz.is_allowed
FROM products p
LEFT JOIN product_delivery_zones pdz ON p.id = pdz.product_id
WHERE p.name ILIKE '%Science Experiment Kit%';

-- Test the RPC function directly
-- Replace 'YOUR_PRODUCT_ID' with the actual product ID from the first query
-- Replace 'YOUR_CITY' and 'YOUR_COUNTRY' with the actual delivery location
/*
SELECT * FROM get_cheapest_delivery_option(
  'YOUR_PRODUCT_ID'::uuid,
  'YOUR_CITY',
  'YOUR_COUNTRY'
);
*/



