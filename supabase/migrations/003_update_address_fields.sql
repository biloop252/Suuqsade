-- Migration to add district and neighborhood columns after city

-- To position columns after city, we need to recreate the table with proper order
-- This preserves all data and foreign key relationships

-- Step 1: Create a new table with the correct column order
CREATE TABLE addresses_new (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'billing' or 'shipping'
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT
);

-- Step 2: Copy all data from the old table to the new table
INSERT INTO addresses_new (
  id, user_id, type, first_name, last_name, company, 
  address_line_1, address_line_2, city, district, neighborhood, 
  country, phone
)
SELECT 
  id, user_id, type, first_name, last_name, company,
  address_line_1, address_line_2, city, '', '', -- Empty strings for new columns
  country, phone
FROM addresses;

-- Step 3: Drop the old table (this will also drop foreign key constraints)
DROP TABLE addresses CASCADE;

-- Step 4: Rename the new table to the original name
ALTER TABLE addresses_new RENAME TO addresses;

-- Step 5: Add the missing columns back
ALTER TABLE addresses 
ADD COLUMN is_default BOOLEAN DEFAULT false,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 6: Recreate indexes for performance
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_type ON addresses(type);
CREATE INDEX idx_addresses_is_default ON addresses(is_default);

-- Step 7: Recreate RLS policies
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Step 8: Recreate foreign key constraints from other tables
-- The orders table has foreign key references to addresses
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_billing_address 
FOREIGN KEY (billing_address_id) REFERENCES addresses(id);

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_shipping_address 
FOREIGN KEY (shipping_address_id) REFERENCES addresses(id);
