-- Create product attributes table for structured attribute management
CREATE TABLE product_attributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'select', 'multiselect', 'boolean', 'color', 'size')),
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT true,
  is_variant_attribute BOOLEAN DEFAULT false, -- Whether this attribute creates variants
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product attribute values table
CREATE TABLE product_attribute_values (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_value TEXT, -- For display purposes (e.g., "Red" for color code "#FF0000")
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, attribute_id, value)
);

-- Create product variant attributes table (for variant-specific attributes)
CREATE TABLE product_variant_attributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(variant_id, attribute_id)
);

-- Insert common product attributes
INSERT INTO product_attributes (id, name, slug, type, description, is_required, is_filterable, is_variant_attribute, sort_order) VALUES
-- Color attributes
('550e8400-e29b-41d4-a716-446655440101', 'Color', 'color', 'color', 'Product color', true, true, true, 1),
('550e8400-e29b-41d4-a716-446655440102', 'Primary Color', 'primary-color', 'color', 'Main color of the product', false, true, true, 2),
('550e8400-e29b-41d4-a716-446655440103', 'Secondary Color', 'secondary-color', 'color', 'Secondary color accent', false, true, false, 3),

-- Size attributes
('550e8400-e29b-41d4-a716-446655440104', 'Size', 'size', 'select', 'Product size', true, true, true, 4),
('550e8400-e29b-41d4-a716-446655440105', 'Clothing Size', 'clothing-size', 'select', 'Clothing size (XS, S, M, L, XL, XXL)', false, true, true, 5),
('550e8400-e29b-41d4-a716-446655440106', 'Shoe Size', 'shoe-size', 'select', 'Shoe size', false, true, true, 6),
('550e8400-e29b-41d4-a716-446655440107', 'Ring Size', 'ring-size', 'select', 'Ring size', false, true, true, 7),

-- Material attributes
('550e8400-e29b-41d4-a716-446655440108', 'Material', 'material', 'select', 'Primary material', false, true, false, 8),
('550e8400-e29b-41d4-a716-446655440109', 'Fabric', 'fabric', 'select', 'Fabric type for clothing', false, true, false, 9),
('550e8400-e29b-41d4-a716-446655440110', 'Metal Type', 'metal-type', 'select', 'Type of metal used', false, true, false, 10),

-- Technical attributes
('550e8400-e29b-41d4-a716-446655440111', 'Storage Capacity', 'storage-capacity', 'select', 'Storage capacity (GB, TB)', false, true, false, 11),
('550e8400-e29b-41d4-a716-446655440112', 'Screen Size', 'screen-size', 'select', 'Screen size in inches', false, true, false, 12),
('550e8400-e29b-41d4-a716-446655440113', 'Processor', 'processor', 'select', 'Processor type and speed', false, true, false, 13),
('550e8400-e29b-41d4-a716-446655440114', 'RAM', 'ram', 'select', 'RAM capacity', false, true, false, 14),
('550e8400-e29b-41d4-a716-446655440115', 'Operating System', 'operating-system', 'select', 'Operating system', false, true, false, 15),

-- Physical attributes
('550e8400-e29b-41d4-a716-446655440116', 'Weight', 'weight', 'number', 'Product weight in grams', false, true, false, 16),
('550e8400-e29b-41d4-a716-446655440117', 'Dimensions', 'dimensions', 'text', 'Product dimensions (L x W x H)', false, true, false, 17),
('550e8400-e29b-41d4-a716-446655440118', 'Length', 'length', 'number', 'Product length in cm', false, true, false, 18),
('550e8400-e29b-41d4-a716-446655440119', 'Width', 'width', 'number', 'Product width in cm', false, true, false, 19),
('550e8400-e29b-41d4-a716-446655440120', 'Height', 'height', 'number', 'Product height in cm', false, true, false, 20),

-- Style attributes
('550e8400-e29b-41d4-a716-446655440121', 'Style', 'style', 'select', 'Product style', false, true, false, 21),
('550e8400-e29b-41d4-a716-446655440122', 'Pattern', 'pattern', 'select', 'Pattern or design', false, true, false, 22),
('550e8400-e29b-41d4-a716-446655440123', 'Brand', 'brand', 'select', 'Brand name', false, true, false, 23),

-- Electronics specific
('550e8400-e29b-41d4-a716-446655440124', 'Connectivity', 'connectivity', 'multiselect', 'Connectivity options (WiFi, Bluetooth, etc.)', false, true, false, 24),
('550e8400-e29b-41d4-a716-446655440125', 'Battery Life', 'battery-life', 'text', 'Battery life specification', false, true, false, 25),
('550e8400-e29b-41d4-a716-446655440126', 'Water Resistance', 'water-resistance', 'select', 'Water resistance rating', false, true, false, 26),

-- Fashion specific
('550e8400-e29b-41d4-a716-446655440127', 'Fit', 'fit', 'select', 'Clothing fit (Slim, Regular, Loose)', false, true, false, 27),
('550e8400-e29b-41d4-a716-446655440128', 'Occasion', 'occasion', 'multiselect', 'Suitable occasions', false, true, false, 28),
('550e8400-e29b-41d4-a716-446655440129', 'Season', 'season', 'multiselect', 'Suitable seasons', false, true, false, 29),

-- Home & Garden specific
('550e8400-e29b-41d4-a716-446655440130', 'Room Type', 'room-type', 'multiselect', 'Suitable room types', false, true, false, 30),
('550e8400-e29b-41d4-a716-446655440131', 'Assembly Required', 'assembly-required', 'boolean', 'Whether assembly is required', false, true, false, 31),
('550e8400-e29b-41d4-a716-446655440132', 'Energy Rating', 'energy-rating', 'select', 'Energy efficiency rating', false, true, false, 32);

-- Insert sample product variants with attributes
-- First, let's get some existing product IDs to work with
-- We'll create variants for some sample products

-- Sample variants for Electronics (Smartphones)
INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active) VALUES
-- iPhone 15 variants
('550e8400-e29b-41d4-a716-446655440201', (SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), 'iPhone 15 - 128GB - Blue', 'IPH15-128-BLUE', 799.00, 749.00, 50, 
 '{"color": "Blue", "storage": "128GB", "ram": "6GB", "screen_size": "6.1 inch", "connectivity": ["5G", "WiFi", "Bluetooth"], "water_resistance": "IP68"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440202', (SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), 'iPhone 15 - 256GB - Blue', 'IPH15-256-BLUE', 899.00, 849.00, 30, 
 '{"color": "Blue", "storage": "256GB", "ram": "6GB", "screen_size": "6.1 inch", "connectivity": ["5G", "WiFi", "Bluetooth"], "water_resistance": "IP68"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440203', (SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), 'iPhone 15 - 128GB - Pink', 'IPH15-128-PINK', 799.00, 749.00, 25, 
 '{"color": "Pink", "storage": "128GB", "ram": "6GB", "screen_size": "6.1 inch", "connectivity": ["5G", "WiFi", "Bluetooth"], "water_resistance": "IP68"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440204', (SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), 'iPhone 15 - 512GB - Black', 'IPH15-512-BLACK', 1099.00, 1049.00, 15, 
 '{"color": "Black", "storage": "512GB", "ram": "6GB", "screen_size": "6.1 inch", "connectivity": ["5G", "WiFi", "Bluetooth"], "water_resistance": "IP68"}'::jsonb, true);

-- Sample variants for Fashion (T-Shirts)
INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440205', (SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), 'Classic T-Shirt - Small - White', 'TSHIRT-S-WHITE', 19.99, 15.99, 100, 
 '{"size": "S", "color": "White", "material": "100% Cotton", "fit": "Regular", "style": "Classic"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440206', (SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), 'Classic T-Shirt - Medium - White', 'TSHIRT-M-WHITE', 19.99, 15.99, 120, 
 '{"size": "M", "color": "White", "material": "100% Cotton", "fit": "Regular", "style": "Classic"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440207', (SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), 'Classic T-Shirt - Large - Black', 'TSHIRT-L-BLACK', 19.99, 15.99, 80, 
 '{"size": "L", "color": "Black", "material": "100% Cotton", "fit": "Regular", "style": "Classic"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440208', (SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), 'Classic T-Shirt - XL - Navy', 'TSHIRT-XL-NAVY', 19.99, 15.99, 60, 
 '{"size": "XL", "color": "Navy", "material": "100% Cotton", "fit": "Regular", "style": "Classic"}'::jsonb, true);

-- Sample variants for Shoes
INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440209', (SELECT id FROM products WHERE name LIKE '%Sneaker%' OR name LIKE '%Shoe%' LIMIT 1), 'Running Sneakers - Size 8 - White', 'SNEAKER-8-WHITE', 89.99, 79.99, 45, 
 '{"shoe_size": "8", "color": "White", "material": "Mesh & Synthetic", "style": "Running", "occasion": ["Sports", "Casual"]}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440210', (SELECT id FROM products WHERE name LIKE '%Sneaker%' OR name LIKE '%Shoe%' LIMIT 1), 'Running Sneakers - Size 9 - Black', 'SNEAKER-9-BLACK', 89.99, 79.99, 50, 
 '{"shoe_size": "9", "color": "Black", "material": "Mesh & Synthetic", "style": "Running", "occasion": ["Sports", "Casual"]}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440211', (SELECT id FROM products WHERE name LIKE '%Sneaker%' OR name LIKE '%Shoe%' LIMIT 1), 'Running Sneakers - Size 10 - Blue', 'SNEAKER-10-BLUE', 89.99, 79.99, 35, 
 '{"shoe_size": "10", "color": "Blue", "material": "Mesh & Synthetic", "style": "Running", "occasion": ["Sports", "Casual"]}'::jsonb, true);

-- Sample variants for Laptops
INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440212', (SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), 'MacBook Pro - 13" - 8GB RAM - 256GB SSD', 'MBP-13-8-256', 1299.00, 1199.00, 20, 
 '{"screen_size": "13 inch", "ram": "8GB", "storage": "256GB SSD", "processor": "Apple M2", "operating_system": "macOS", "color": "Space Gray"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440213', (SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), 'MacBook Pro - 13" - 16GB RAM - 512GB SSD', 'MBP-13-16-512', 1499.00, 1399.00, 15, 
 '{"screen_size": "13 inch", "ram": "16GB", "storage": "512GB SSD", "processor": "Apple M2", "operating_system": "macOS", "color": "Space Gray"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440214', (SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), 'MacBook Pro - 15" - 16GB RAM - 1TB SSD', 'MBP-15-16-1TB', 1999.00, 1899.00, 10, 
 '{"screen_size": "15 inch", "ram": "16GB", "storage": "1TB SSD", "processor": "Apple M2 Pro", "operating_system": "macOS", "color": "Space Gray"}'::jsonb, true);

-- Sample variants for Watches
INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440215', (SELECT id FROM products WHERE name LIKE '%Watch%' LIMIT 1), 'Smart Watch - 42mm - Black', 'WATCH-42-BLACK', 299.99, 249.99, 75, 
 '{"size": "42mm", "color": "Black", "material": "Aluminum", "water_resistance": "5ATM", "connectivity": ["Bluetooth", "WiFi"], "battery_life": "18 hours"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440216', (SELECT id FROM products WHERE name LIKE '%Watch%' LIMIT 1), 'Smart Watch - 44mm - Silver', 'WATCH-44-SILVER', 329.99, 279.99, 60, 
 '{"size": "44mm", "color": "Silver", "material": "Aluminum", "water_resistance": "5ATM", "connectivity": ["Bluetooth", "WiFi"], "battery_life": "18 hours"}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440217', (SELECT id FROM products WHERE name LIKE '%Watch%' LIMIT 1), 'Smart Watch - 40mm - Rose Gold', 'WATCH-40-ROSE', 279.99, 229.99, 40, 
 '{"size": "40mm", "color": "Rose Gold", "material": "Aluminum", "water_resistance": "5ATM", "connectivity": ["Bluetooth", "WiFi"], "battery_life": "18 hours"}'::jsonb, true);

-- Sample variants for Bags
INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440218', (SELECT id FROM products WHERE name LIKE '%Bag%' OR name LIKE '%Backpack%' LIMIT 1), 'Leather Handbag - Small - Brown', 'BAG-SMALL-BROWN', 79.99, 59.99, 30, 
 '{"size": "Small", "color": "Brown", "material": "Genuine Leather", "style": "Handbag", "occasion": ["Casual", "Work"]}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440219', (SELECT id FROM products WHERE name LIKE '%Bag%' OR name LIKE '%Backpack%' LIMIT 1), 'Leather Handbag - Medium - Black', 'BAG-MED-BLACK', 99.99, 79.99, 25, 
 '{"size": "Medium", "color": "Black", "material": "Genuine Leather", "style": "Handbag", "occasion": ["Casual", "Work", "Formal"]}'::jsonb, true),

('550e8400-e29b-41d4-a716-446655440220', (SELECT id FROM products WHERE name LIKE '%Bag%' OR name LIKE '%Backpack%' LIMIT 1), 'Canvas Backpack - Large - Navy', 'BAG-LARGE-NAVY', 49.99, 39.99, 50, 
 '{"size": "Large", "color": "Navy", "material": "Canvas", "style": "Backpack", "occasion": ["Travel", "School", "Work"]}'::jsonb, true);

-- Insert sample product attribute values for some products
-- This will link products to their attributes with specific values

-- For a sample iPhone product
INSERT INTO product_attribute_values (product_id, attribute_id, value, display_value) VALUES
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440101', '#007AFF', 'Blue'),
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440111', '128', '128GB'),
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440112', '6.1', '6.1 inch'),
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440113', 'A17 Pro', 'Apple A17 Pro'),
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440114', '8', '8GB'),
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440115', 'iOS 17', 'iOS 17'),
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440124', '5G,WiFi,Bluetooth', '5G, WiFi, Bluetooth'),
((SELECT id FROM products WHERE name LIKE '%iPhone%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440126', 'IP68', 'IP68 Water Resistant');

-- For a sample T-Shirt product
INSERT INTO product_attribute_values (product_id, attribute_id, value, display_value) VALUES
((SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440101', '#FFFFFF', 'White'),
((SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440104', 'M', 'Medium'),
((SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440108', 'Cotton', '100% Cotton'),
((SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440121', 'Classic', 'Classic'),
((SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440127', 'Regular', 'Regular Fit'),
((SELECT id FROM products WHERE name LIKE '%T-Shirt%' OR name LIKE '%Tshirt%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440128', 'Casual,Work', 'Casual, Work');

-- For a sample Laptop product
INSERT INTO product_attribute_values (product_id, attribute_id, value, display_value) VALUES
((SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440112', '13', '13 inch'),
((SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440113', 'M2', 'Apple M2'),
((SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440114', '8', '8GB'),
((SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440115', 'macOS', 'macOS'),
((SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440116', '1.4', '1.4 kg'),
((SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440117', '30.41x21.24x1.56', '30.41 x 21.24 x 1.56 cm'),
((SELECT id FROM products WHERE name LIKE '%Laptop%' LIMIT 1), '550e8400-e29b-41d4-a716-446655440124', 'WiFi,Bluetooth,Thunderbolt', 'WiFi, Bluetooth, Thunderbolt');

-- Insert sample variant attributes (linking variants to their specific attribute values)
-- iPhone variants
INSERT INTO product_variant_attributes (variant_id, attribute_id, value, display_value) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '#007AFF', 'Blue'),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440111', '128', '128GB'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440101', '#007AFF', 'Blue'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440111', '256', '256GB'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', '#FF69B4', 'Pink'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440111', '128', '128GB'),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440101', '#000000', 'Black'),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440111', '512', '512GB');

-- T-Shirt variants
INSERT INTO product_variant_attributes (variant_id, attribute_id, value, display_value) VALUES
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440104', 'S', 'Small'),
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440101', '#FFFFFF', 'White'),
('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440104', 'M', 'Medium'),
('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440101', '#FFFFFF', 'White'),
('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440104', 'L', 'Large'),
('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440101', '#000000', 'Black'),
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440104', 'XL', 'Extra Large'),
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440101', '#000080', 'Navy');

-- Shoe variants
INSERT INTO product_variant_attributes (variant_id, attribute_id, value, display_value) VALUES
('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440106', '8', 'Size 8'),
('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440101', '#FFFFFF', 'White'),
('550e8400-e29b-41d4-a716-446655440210', '550e8400-e29b-41d4-a716-446655440106', '9', 'Size 9'),
('550e8400-e29b-41d4-a716-446655440210', '550e8400-e29b-41d4-a716-446655440101', '#000000', 'Black'),
('550e8400-e29b-41d4-a716-446655440211', '550e8400-e29b-41d4-a716-446655440106', '10', 'Size 10'),
('550e8400-e29b-41d4-a716-446655440211', '550e8400-e29b-41d4-a716-446655440101', '#0000FF', 'Blue');

-- Create indexes for better performance
CREATE INDEX idx_product_attribute_values_product_id ON product_attribute_values(product_id);
CREATE INDEX idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);
CREATE INDEX idx_product_variant_attributes_variant_id ON product_variant_attributes(variant_id);
CREATE INDEX idx_product_variant_attributes_attribute_id ON product_variant_attributes(attribute_id);
CREATE INDEX idx_product_attributes_slug ON product_attributes(slug);
CREATE INDEX idx_product_attributes_type ON product_attributes(type);
CREATE INDEX idx_product_attributes_is_variant_attribute ON product_attributes(is_variant_attribute);

-- Add some sample products with variants if they don't exist
-- This ensures we have products to attach variants to
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440301',
  'iPhone 15 Pro',
  'iphone-15-pro',
  'The most advanced iPhone with titanium design and A17 Pro chip',
  'Advanced iPhone with titanium design',
  'IPH15-PRO',
  (SELECT id FROM categories WHERE slug = 'smartphones' LIMIT 1),
  (SELECT id FROM brands WHERE name LIKE '%Apple%' OR name LIKE '%TechCorp%' LIMIT 1),
  999.00,
  949.00,
  0,
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'iphone-15-pro');

INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440302',
  'Classic Cotton T-Shirt',
  'classic-cotton-tshirt',
  'Comfortable 100% cotton t-shirt in various colors and sizes',
  'Comfortable cotton t-shirt',
  'TSHIRT-CLASSIC',
  (SELECT id FROM categories WHERE slug = 'clothing' LIMIT 1),
  (SELECT id FROM brands WHERE name LIKE '%StyleHub%' LIMIT 1),
  19.99,
  15.99,
  0,
  true,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'classic-cotton-tshirt');

INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440303',
  'Running Sneakers',
  'running-sneakers',
  'Comfortable running shoes with breathable mesh upper',
  'Comfortable running shoes',
  'SNEAKER-RUNNING',
  (SELECT id FROM categories WHERE slug = 'shoes' LIMIT 1),
  (SELECT id FROM brands WHERE name LIKE '%FitLife%' LIMIT 1),
  89.99,
  79.99,
  0,
  true,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'running-sneakers');

INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440304',
  'MacBook Pro 13-inch',
  'macbook-pro-13',
  'Powerful laptop with M2 chip and Retina display',
  'Powerful M2 MacBook Pro',
  'MBP-13-M2',
  (SELECT id FROM categories WHERE slug = 'laptops' LIMIT 1),
  (SELECT id FROM brands WHERE name LIKE '%Apple%' OR name LIKE '%TechCorp%' LIMIT 1),
  1299.00,
  1199.00,
  0,
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'macbook-pro-13');

INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440305',
  'Smart Watch Series 9',
  'smart-watch-series-9',
  'Advanced smartwatch with health monitoring and fitness tracking',
  'Advanced smartwatch',
  'WATCH-S9',
  (SELECT id FROM categories WHERE slug = 'smartwatches' LIMIT 1),
  (SELECT id FROM brands WHERE name LIKE '%Apple%' OR name LIKE '%TechCorp%' LIMIT 1),
  399.00,
  349.00,
  0,
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'smart-watch-series-9');

INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440306',
  'Leather Handbag',
  'leather-handbag',
  'Elegant leather handbag perfect for work and casual occasions',
  'Elegant leather handbag',
  'BAG-LEATHER',
  (SELECT id FROM categories WHERE slug = 'bags' LIMIT 1),
  (SELECT id FROM brands WHERE name LIKE '%StyleHub%' LIMIT 1),
  79.99,
  59.99,
  0,
  true,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'leather-handbag');
