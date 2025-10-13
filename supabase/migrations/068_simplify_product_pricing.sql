-- Migration to simplify product pricing structure
-- Remove sale_price and cost_price fields from products and product_variants tables

-- First, update any existing data to preserve sale_price as the main price if it exists
-- This ensures we don't lose any important pricing data
UPDATE products 
SET price = COALESCE(sale_price, price)
WHERE sale_price IS NOT NULL AND sale_price > 0;

UPDATE product_variants 
SET price = COALESCE(sale_price, price)
WHERE sale_price IS NOT NULL AND sale_price > 0;

-- Drop the sale_price and cost_price columns from products table
ALTER TABLE products DROP COLUMN IF EXISTS sale_price;
ALTER TABLE products DROP COLUMN IF EXISTS cost_price;

-- Drop the sale_price column from product_variants table
ALTER TABLE product_variants DROP COLUMN IF EXISTS sale_price;

-- Update any views or functions that might reference these columns
-- (This will be handled in the application code)

-- Add a comment to document the change
COMMENT ON COLUMN products.price IS 'Single price field for products (replaces price, sale_price, cost_price structure)';
COMMENT ON COLUMN product_variants.price IS 'Single price field for product variants (replaces price, sale_price structure)';
