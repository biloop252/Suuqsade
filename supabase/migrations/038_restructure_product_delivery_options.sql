-- Restructure Product Delivery Options Migration
-- This migration modifies the product_delivery_options table to use delivery_rate_id as FK
-- instead of separate pickup_location_id and delivery_method_id

-- First, create a backup of existing data
CREATE TABLE product_delivery_options_backup AS 
SELECT * FROM product_delivery_options;

-- Drop the existing table and recreate with new structure
DROP TABLE product_delivery_options CASCADE;

-- Create the new product_delivery_options table with delivery_rate_id as FK
CREATE TABLE product_delivery_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  delivery_rate_id UUID REFERENCES delivery_rates(id) ON DELETE CASCADE,
  is_free_delivery BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, delivery_rate_id)
);

-- Add RLS policies
ALTER TABLE product_delivery_options ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read product delivery options
CREATE POLICY "Anyone can view product delivery options" ON product_delivery_options
  FOR SELECT USING (true);

-- Allow authenticated users to insert product delivery options
CREATE POLICY "Authenticated users can insert product delivery options" ON product_delivery_options
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update product delivery options
CREATE POLICY "Authenticated users can update product delivery options" ON product_delivery_options
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete product delivery options
CREATE POLICY "Authenticated users can delete product delivery options" ON product_delivery_options
  FOR DELETE USING (auth.role() = 'authenticated');

-- Migrate existing data from backup to new structure
-- This will create product delivery options based on existing pickup locations and delivery methods
-- that have corresponding delivery rates
INSERT INTO product_delivery_options (product_id, delivery_rate_id, is_free_delivery, created_at, updated_at)
SELECT DISTINCT
  pdo_backup.product_id,
  dr.id as delivery_rate_id,
  pdo_backup.is_free_delivery,
  pdo_backup.created_at,
  pdo_backup.updated_at
FROM product_delivery_options_backup pdo_backup
JOIN pickup_locations pl ON pdo_backup.pickup_location_id = pl.id
JOIN delivery_methods dm ON pdo_backup.delivery_method_id = dm.id
JOIN delivery_rates dr ON (
  pl.city = dr.pickup_city 
  AND dm.id = dr.delivery_method_id
  AND dr.is_active = true
)
WHERE pl.is_active = true 
  AND dm.is_active = true;

-- Drop the backup table
DROP TABLE product_delivery_options_backup;

-- Add comments for documentation
COMMENT ON TABLE product_delivery_options IS 'Product delivery options linking products to specific delivery rates';
COMMENT ON COLUMN product_delivery_options.delivery_rate_id IS 'Reference to delivery_rates table containing pickup/delivery city and method details';
COMMENT ON COLUMN product_delivery_options.is_free_delivery IS 'Whether this product has free delivery for this specific delivery rate';
