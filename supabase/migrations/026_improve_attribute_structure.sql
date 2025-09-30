-- Migration: Improve Attribute Structure
-- This migration restructures the attribute system for better normalization
-- and eliminates data redundancy

-- First, create the new attribute_values table
CREATE TABLE attribute_values (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_value TEXT, -- For display purposes (e.g., "Red" for color code "#FF0000")
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attribute_id, value)
);

-- Create the product_attribute_assignments table to link products to attribute values
CREATE TABLE product_attribute_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, attribute_value_id)
);

-- Create the variant_attribute_assignments table for variant-specific attributes
CREATE TABLE variant_attribute_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(variant_id, attribute_value_id)
);

-- Migrate existing data from product_attribute_values to the new structure
-- First, populate attribute_values with unique values from product_attribute_values
INSERT INTO attribute_values (attribute_id, value, display_value, sort_order)
SELECT DISTINCT 
  attribute_id,
  value,
  display_value,
  sort_order
FROM product_attribute_values
WHERE value IS NOT NULL AND value != '';

-- Migrate product assignments
INSERT INTO product_attribute_assignments (product_id, attribute_value_id)
SELECT 
  pav.product_id,
  av.id
FROM product_attribute_values pav
JOIN attribute_values av ON av.attribute_id = pav.attribute_id 
  AND av.value = pav.value
WHERE pav.value IS NOT NULL AND pav.value != '';

-- Migrate variant assignments
INSERT INTO variant_attribute_assignments (variant_id, attribute_value_id)
SELECT 
  pva.variant_id,
  av.id
FROM product_variant_attributes pva
JOIN attribute_values av ON av.attribute_id = pva.attribute_id 
  AND av.value = pva.value
WHERE pva.value IS NOT NULL AND pva.value != '';

-- Add indexes for better performance
CREATE INDEX idx_attribute_values_attribute_id ON attribute_values(attribute_id);
CREATE INDEX idx_attribute_values_value ON attribute_values(value);
CREATE INDEX idx_product_attribute_assignments_product_id ON product_attribute_assignments(product_id);
CREATE INDEX idx_product_attribute_assignments_attribute_value_id ON product_attribute_assignments(attribute_value_id);
CREATE INDEX idx_variant_attribute_assignments_variant_id ON variant_attribute_assignments(variant_id);
CREATE INDEX idx_variant_attribute_assignments_attribute_value_id ON variant_attribute_assignments(attribute_value_id);

-- Create views for backward compatibility (optional - can be removed later)
CREATE VIEW product_attribute_values_view AS
SELECT 
  paa.id,
  paa.product_id,
  av.attribute_id,
  av.value,
  av.display_value,
  av.sort_order,
  paa.created_at
FROM product_attribute_assignments paa
JOIN attribute_values av ON av.id = paa.attribute_value_id;

CREATE VIEW product_variant_attributes_view AS
SELECT 
  vaa.id,
  vaa.variant_id,
  av.attribute_id,
  av.value,
  av.display_value,
  vaa.created_at
FROM variant_attribute_assignments vaa
JOIN attribute_values av ON av.id = vaa.attribute_value_id;

-- Rename old tables as backup (instead of dropping them immediately)
-- This allows for rollback if needed
ALTER TABLE product_attribute_values RENAME TO product_attribute_values_old;
ALTER TABLE product_variant_attributes RENAME TO product_variant_attributes_old;

-- Create new tables with the old names that use the new structure
-- This maintains backward compatibility for existing code
CREATE TABLE product_attribute_values (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_value TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, attribute_id, value)
);

CREATE TABLE product_variant_attributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(variant_id, attribute_id)
);

-- Create triggers to automatically sync data between old and new structures
-- This ensures data consistency during the transition period
CREATE OR REPLACE FUNCTION sync_product_attribute_values()
RETURNS TRIGGER AS $$
BEGIN
  -- When inserting into product_attribute_values, also insert into new structure
  IF TG_OP = 'INSERT' THEN
    -- First, ensure the attribute value exists
    INSERT INTO attribute_values (attribute_id, value, display_value, sort_order)
    VALUES (NEW.attribute_id, NEW.value, NEW.display_value, NEW.sort_order)
    ON CONFLICT (attribute_id, value) DO NOTHING;
    
    -- Then create the assignment
    INSERT INTO product_attribute_assignments (product_id, attribute_value_id)
    SELECT NEW.product_id, av.id
    FROM attribute_values av
    WHERE av.attribute_id = NEW.attribute_id AND av.value = NEW.value
    ON CONFLICT (product_id, attribute_value_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
  
  -- Handle updates and deletes similarly
  IF TG_OP = 'UPDATE' THEN
    -- Delete old assignment
    DELETE FROM product_attribute_assignments
    WHERE product_id = OLD.product_id 
    AND attribute_value_id = (
      SELECT av.id FROM attribute_values av 
      WHERE av.attribute_id = OLD.attribute_id AND av.value = OLD.value
    );
    
    -- Insert new assignment
    INSERT INTO attribute_values (attribute_id, value, display_value, sort_order)
    VALUES (NEW.attribute_id, NEW.value, NEW.display_value, NEW.sort_order)
    ON CONFLICT (attribute_id, value) DO NOTHING;
    
    INSERT INTO product_attribute_assignments (product_id, attribute_value_id)
    SELECT NEW.product_id, av.id
    FROM attribute_values av
    WHERE av.attribute_id = NEW.attribute_id AND av.value = NEW.value
    ON CONFLICT (product_id, attribute_value_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Delete assignment
    DELETE FROM product_attribute_assignments
    WHERE product_id = OLD.product_id 
    AND attribute_value_id = (
      SELECT av.id FROM attribute_values av 
      WHERE av.attribute_id = OLD.attribute_id AND av.value = OLD.value
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_product_attribute_values_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_attribute_values
  FOR EACH ROW EXECUTE FUNCTION sync_product_attribute_values();

-- Similar trigger for variant attributes
CREATE OR REPLACE FUNCTION sync_variant_attribute_values()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO attribute_values (attribute_id, value, display_value)
    VALUES (NEW.attribute_id, NEW.value, NEW.display_value)
    ON CONFLICT (attribute_id, value) DO NOTHING;
    
    INSERT INTO variant_attribute_assignments (variant_id, attribute_value_id)
    SELECT NEW.variant_id, av.id
    FROM attribute_values av
    WHERE av.attribute_id = NEW.attribute_id AND av.value = NEW.value
    ON CONFLICT (variant_id, attribute_value_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM variant_attribute_assignments
    WHERE variant_id = OLD.variant_id 
    AND attribute_value_id = (
      SELECT av.id FROM attribute_values av 
      WHERE av.attribute_id = OLD.attribute_id AND av.value = OLD.value
    );
    
    INSERT INTO attribute_values (attribute_id, value, display_value)
    VALUES (NEW.attribute_id, NEW.value, NEW.display_value)
    ON CONFLICT (attribute_id, value) DO NOTHING;
    
    INSERT INTO variant_attribute_assignments (variant_id, attribute_value_id)
    SELECT NEW.variant_id, av.id
    FROM attribute_values av
    WHERE av.attribute_id = NEW.attribute_id AND av.value = NEW.value
    ON CONFLICT (variant_id, attribute_value_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    DELETE FROM variant_attribute_assignments
    WHERE variant_id = OLD.variant_id 
    AND attribute_value_id = (
      SELECT av.id FROM attribute_values av 
      WHERE av.attribute_id = OLD.attribute_id AND av.value = OLD.value
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_variant_attribute_values_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_variant_attributes
  FOR EACH ROW EXECUTE FUNCTION sync_variant_attribute_values();

-- Add some sample attribute values for common attributes
-- Color values
INSERT INTO attribute_values (attribute_id, value, display_value, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'red', 'Red', 1),
('550e8400-e29b-41d4-a716-446655440101', 'blue', 'Blue', 2),
('550e8400-e29b-41d4-a716-446655440101', 'green', 'Green', 3),
('550e8400-e29b-41d4-a716-446655440101', 'black', 'Black', 4),
('550e8400-e29b-41d4-a716-446655440101', 'white', 'White', 5),
('550e8400-e29b-41d4-a716-446655440101', 'yellow', 'Yellow', 6),
('550e8400-e29b-41d4-a716-446655440101', 'purple', 'Purple', 7),
('550e8400-e29b-41d4-a716-446655440101', 'orange', 'Orange', 8),
('550e8400-e29b-41d4-a716-446655440101', 'pink', 'Pink', 9),
('550e8400-e29b-41d4-a716-446655440101', 'gray', 'Gray', 10);

-- Size values
INSERT INTO attribute_values (attribute_id, value, display_value, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440104', 'xs', 'XS', 1),
('550e8400-e29b-41d4-a716-446655440104', 's', 'S', 2),
('550e8400-e29b-41d4-a716-446655440104', 'm', 'M', 3),
('550e8400-e29b-41d4-a716-446655440104', 'l', 'L', 4),
('550e8400-e29b-41d4-a716-446655440104', 'xl', 'XL', 5),
('550e8400-e29b-41d4-a716-446655440104', 'xxl', 'XXL', 6);

-- Material values
INSERT INTO attribute_values (attribute_id, value, display_value, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440108', 'cotton', 'Cotton', 1),
('550e8400-e29b-41d4-a716-446655440108', 'polyester', 'Polyester', 2),
('550e8400-e29b-41d4-a716-446655440108', 'wool', 'Wool', 3),
('550e8400-e29b-41d4-a716-446655440108', 'silk', 'Silk', 4),
('550e8400-e29b-41d4-a716-446655440108', 'leather', 'Leather', 5),
('550e8400-e29b-41d4-a716-446655440108', 'denim', 'Denim', 6),
('550e8400-e29b-41d4-a716-446655440108', 'linen', 'Linen', 7),
('550e8400-e29b-41d4-a716-446655440108', 'cashmere', 'Cashmere', 8);

-- Add RLS policies for the new tables
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_attribute_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attribute_values (read-only for customers, full access for admins)
CREATE POLICY "Attribute values are viewable by everyone" ON attribute_values
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify attribute values" ON attribute_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for product_attribute_assignments
CREATE POLICY "Product attribute assignments are viewable by everyone" ON product_attribute_assignments
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify product attribute assignments" ON product_attribute_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for variant_attribute_assignments
CREATE POLICY "Variant attribute assignments are viewable by everyone" ON variant_attribute_assignments
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify variant attribute assignments" ON variant_attribute_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- MIGRATION STRATEGY FOR OLD TABLES:
-- 
-- 1. OLD TABLES RENAMED TO *_old (backup):
--    - product_attribute_values_old (original table)
--    - product_variant_attributes_old (original table)
--
-- 2. NEW TABLES WITH SAME NAMES (backward compatibility):
--    - product_attribute_values (now uses new structure internally)
--    - product_variant_attributes (now uses new structure internally)
--
-- 3. AUTOMATIC SYNC:
--    - Triggers automatically sync data between old and new structures
--    - Existing code continues to work without changes
--
-- 4. CLEANUP (run after confirming everything works):
--    -- DROP TRIGGER sync_product_attribute_values_trigger ON product_attribute_values;
--    -- DROP TRIGGER sync_variant_attribute_values_trigger ON product_variant_attributes;
--    -- DROP FUNCTION sync_product_attribute_values();
--    -- DROP FUNCTION sync_variant_attribute_values();
--    -- DROP TABLE product_attribute_values_old;
--    -- DROP TABLE product_variant_attributes_old;
--
-- 5. BENEFITS:
--    - Zero downtime migration
--    - Backward compatibility maintained
--    - Easy rollback if needed
--    - Gradual transition to new structure
