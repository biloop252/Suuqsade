-- Remove all existing data
DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM brands;
DELETE FROM categories;

-- Create main categories with subcategories
INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES
-- Electronics
('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'electronics', 'Latest gadgets and technology products', true, 1),
('550e8400-e29b-41d4-a716-446655440011', 'Smartphones', 'smartphones', 'Latest smartphones and mobile devices', true, 1),
('550e8400-e29b-41d4-a716-446655440012', 'Laptops', 'laptops', 'Laptops and portable computers', true, 2),
('550e8400-e29b-41d4-a716-446655440013', 'TVs', 'tvs', 'Televisions and displays', true, 3),
('550e8400-e29b-41d4-a716-446655440014', 'Headphones', 'headphones', 'Audio devices and headphones', true, 4),
('550e8400-e29b-41d4-a716-446655440015', 'Smartwatches', 'smartwatches', 'Wearable smart devices', true, 5),

-- Fashion
('550e8400-e29b-41d4-a716-446655440002', 'Fashion', 'fashion', 'Trendy clothing and accessories', true, 2),
('550e8400-e29b-41d4-a716-446655440021', 'Clothing', 'clothing', 'Apparel and garments', true, 1),
('550e8400-e29b-41d4-a716-446655440022', 'Shoes', 'shoes', 'Footwear for all occasions', true, 2),
('550e8400-e29b-41d4-a716-446655440023', 'Accessories', 'accessories', 'Fashion accessories and jewelry', true, 3),
('550e8400-e29b-41d4-a716-446655440024', 'Bags', 'bags', 'Handbags, backpacks, and luggage', true, 4),

-- Home & Garden
('550e8400-e29b-41d4-a716-446655440003', 'Home & Garden', 'home-garden', 'Everything for your home and garden', true, 3),
('550e8400-e29b-41d4-a716-446655440031', 'Smart Home Devices', 'smart-home-devices', 'Smart home automation and IoT devices', true, 1),
('550e8400-e29b-41d4-a716-446655440032', 'Furniture', 'furniture', 'Home and office furniture', true, 2),
('550e8400-e29b-41d4-a716-446655440033', 'Garden Tools', 'garden-tools', 'Gardening equipment and tools', true, 3),

-- Sports
('550e8400-e29b-41d4-a716-446655440004', 'Sports', 'sports', 'Sports equipment and fitness gear', true, 4),
('550e8400-e29b-41d4-a716-446655440041', 'Fitness Equipment', 'fitness-equipment', 'Exercise and fitness gear', true, 1),
('550e8400-e29b-41d4-a716-446655440042', 'Sports Gear', 'sports-gear', 'Equipment for various sports', true, 2),
('550e8400-e29b-41d4-a716-446655440043', 'Outdoor Items', 'outdoor-items', 'Camping and outdoor equipment', true, 3),

-- Books
('550e8400-e29b-41d4-a716-446655440005', 'Books', 'books', 'Books for all ages and interests', true, 5),
('550e8400-e29b-41d4-a716-446655440051', 'Various Genres', 'various-genres', 'Books across different genres', true, 1),
('550e8400-e29b-41d4-a716-446655440052', 'Formats', 'formats', 'Different book formats and editions', true, 2),

-- Beauty
('550e8400-e29b-41d4-a716-446655440006', 'Beauty', 'beauty', 'Beauty and personal care products', true, 6),
('550e8400-e29b-41d4-a716-446655440061', 'Skincare', 'skincare', 'Skin care and treatment products', true, 1),
('550e8400-e29b-41d4-a716-446655440062', 'Makeup', 'makeup', 'Cosmetics and makeup products', true, 2),
('550e8400-e29b-41d4-a716-446655440063', 'Personal Care Items', 'personal-care-items', 'Personal hygiene and care products', true, 3),

-- Automotive
('550e8400-e29b-41d4-a716-446655440007', 'Automotive', 'automotive', 'Car accessories and parts', true, 7),
('550e8400-e29b-41d4-a716-446655440071', 'Car Accessories', 'car-accessories', 'Automotive accessories and add-ons', true, 1),
('550e8400-e29b-41d4-a716-446655440072', 'Parts', 'parts', 'Car parts and components', true, 2),

-- Toys
('550e8400-e29b-41d4-a716-446655440008', 'Toys', 'toys', 'Toys and games for all ages', true, 8),
('550e8400-e29b-41d4-a716-446655440081', 'Educational Toys', 'educational-toys', 'Learning and educational toys', true, 1),
('550e8400-e29b-41d4-a716-446655440082', 'Games', 'games', 'Board games and video games', true, 2),
('550e8400-e29b-41d4-a716-446655440083', 'Puzzles', 'puzzles', 'Jigsaw puzzles and brain teasers', true, 3);

-- Update parent_id for subcategories
UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440001' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440013',
  '550e8400-e29b-41d4-a716-446655440014',
  '550e8400-e29b-41d4-a716-446655440015'
);

UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440002' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440022',
  '550e8400-e29b-41d4-a716-446655440023',
  '550e8400-e29b-41d4-a716-446655440024'
);

UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440003' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440032',
  '550e8400-e29b-41d4-a716-446655440033'
);

UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440004' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440041',
  '550e8400-e29b-41d4-a716-446655440042',
  '550e8400-e29b-41d4-a716-446655440043'
);

UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440005' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440051',
  '550e8400-e29b-41d4-a716-446655440052'
);

UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440006' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440061',
  '550e8400-e29b-41d4-a716-446655440062',
  '550e8400-e29b-41d4-a716-446655440063'
);

UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440007' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440071',
  '550e8400-e29b-41d4-a716-446655440072'
);

UPDATE categories SET parent_id = '550e8400-e29b-41d4-a716-446655440008' WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440081',
  '550e8400-e29b-41d4-a716-446655440082',
  '550e8400-e29b-41d4-a716-446655440083'
);











































