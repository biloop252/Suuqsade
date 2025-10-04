-- Create new brands
INSERT INTO brands (id, name, slug, description, is_active) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'TechCorp', 'techcorp', 'Leading technology company', true),
('650e8400-e29b-41d4-a716-446655440002', 'StyleHub', 'stylehub', 'Fashion and lifestyle brand', true),
('650e8400-e29b-41d4-a716-446655440003', 'HomeMax', 'homemax', 'Home improvement and garden supplies', true),
('650e8400-e29b-41d4-a716-446655440004', 'FitLife', 'fitlife', 'Sports and fitness equipment', true),
('650e8400-e29b-41d4-a716-446655440005', 'BookWorld', 'bookworld', 'Publishing and books', true),
('650e8400-e29b-41d4-a716-446655440006', 'BeautyPlus', 'beautyplus', 'Beauty and personal care products', true),
('650e8400-e29b-41d4-a716-446655440007', 'AutoPro', 'autopro', 'Automotive accessories and parts', true),
('650e8400-e29b-41d4-a716-446655440008', 'PlayTime', 'playtime', 'Toys and games manufacturer', true);

-- Electronics - Smartphones
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'Latest flagship smartphone with titanium design, A17 Pro chip, and advanced camera system with 5x telephoto zoom.', 'Latest flagship smartphone with titanium design', 'TECH-SM-001', '550e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440001', 1199.99, 1099.99, 50, true, true),
('750e8400-e29b-41d4-a716-446655440002', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Premium Android smartphone with S Pen, 200MP camera, and AI-powered features for enhanced productivity.', 'Premium Android smartphone with S Pen', 'TECH-SM-002', '550e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440001', 1299.99, 1199.99, 40, true, true),
('750e8400-e29b-41d4-a716-446655440003', 'Google Pixel 8 Pro', 'google-pixel-8-pro', 'AI-powered smartphone with advanced computational photography and Google Assistant integration.', 'AI-powered smartphone with advanced photography', 'TECH-SM-003', '550e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440001', 999.99, 899.99, 60, true, false),
('750e8400-e29b-41d4-a716-446655440004', 'OnePlus 12', 'oneplus-12', 'High-performance smartphone with Snapdragon 8 Gen 3, 100W fast charging, and premium build quality.', 'High-performance smartphone with fast charging', 'TECH-SM-004', '550e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440001', 799.99, 699.99, 45, true, false);

-- Electronics - Laptops
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440005', 'MacBook Pro 16-inch', 'macbook-pro-16-inch', 'Professional laptop with M3 Max chip, Liquid Retina XDR display, and up to 22 hours of battery life.', 'Professional laptop with M3 Max chip', 'TECH-LP-005', '550e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440001', 2499.99, 2299.99, 25, true, true),
('750e8400-e29b-41d4-a716-446655440006', 'Dell XPS 15', 'dell-xps-15', 'Premium Windows laptop with 4K OLED display, Intel Core i7 processor, and sleek aluminum design.', 'Premium Windows laptop with 4K OLED', 'TECH-LP-006', '550e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440001', 1799.99, 1599.99, 30, true, true),
('750e8400-e29b-41d4-a716-446655440007', 'ASUS ROG Strix G15', 'asus-rog-strix-g15', 'Gaming laptop with RTX 4070 graphics, AMD Ryzen 9 processor, and high-refresh rate display.', 'Gaming laptop with RTX 4070 graphics', 'TECH-LP-007', '550e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440001', 1499.99, 1299.99, 20, true, false),
('750e8400-e29b-41d4-a716-446655440008', 'Lenovo ThinkPad X1 Carbon', 'lenovo-thinkpad-x1-carbon', 'Business laptop with Intel Core i7, 14-inch display, and legendary ThinkPad durability.', 'Business laptop with legendary durability', 'TECH-LP-008', '550e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440001', 1899.99, 1699.99, 35, true, false);

-- Electronics - TVs
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440009', 'Samsung QN90C Neo QLED 65"', 'samsung-qn90c-neo-qled-65', 'Premium 4K Neo QLED TV with Mini LED backlighting, HDR10+, and smart TV features.', 'Premium 4K Neo QLED TV with Mini LED', 'TECH-TV-009', '550e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440001', 1999.99, 1799.99, 15, true, true),
('750e8400-e29b-41d4-a716-446655440010', 'LG C3 OLED 55"', 'lg-c3-oled-55', 'OLED TV with perfect blacks, Dolby Vision IQ, and webOS smart platform.', 'OLED TV with perfect blacks and Dolby Vision', 'TECH-TV-010', '550e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440001', 1499.99, 1299.99, 20, true, true),
('750e8400-e29b-41d4-a716-446655440011', 'Sony A95K OLED 65"', 'sony-a95k-oled-65', 'QD-OLED TV with Cognitive Processor XR and Acoustic Surface Audio+ technology.', 'QD-OLED TV with Cognitive Processor XR', 'TECH-TV-011', '550e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440001', 2999.99, 2699.99, 10, true, false),
('750e8400-e29b-41d4-a716-446655440012', 'TCL 6-Series 75"', 'tcl-6-series-75', '4K Mini LED TV with Google TV, Dolby Vision, and excellent value for money.', '4K Mini LED TV with Google TV', 'TECH-TV-012', '550e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440001', 999.99, 899.99, 25, true, false);

-- Electronics - Headphones
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440013', 'Sony WH-1000XM5', 'sony-wh-1000xm5', 'Premium noise-canceling headphones with 30-hour battery life and industry-leading ANC technology.', 'Premium noise-canceling headphones', 'TECH-HP-013', '550e8400-e29b-41d4-a716-446655440014', '650e8400-e29b-41d4-a716-446655440001', 399.99, 349.99, 50, true, true),
('750e8400-e29b-41d4-a716-446655440014', 'Apple AirPods Pro 2', 'apple-airpods-pro-2', 'Wireless earbuds with active noise cancellation, spatial audio, and H2 chip for enhanced performance.', 'Wireless earbuds with active noise cancellation', 'TECH-HP-014', '550e8400-e29b-41d4-a716-446655440014', '650e8400-e29b-41d4-a716-446655440001', 249.99, 229.99, 75, true, true),
('750e8400-e29b-41d4-a716-446655440015', 'Bose QuietComfort 45', 'bose-quietcomfort-45', 'Comfortable over-ear headphones with world-class noise cancellation and balanced sound.', 'Comfortable over-ear headphones with ANC', 'TECH-HP-015', '550e8400-e29b-41d4-a716-446655440014', '650e8400-e29b-41d4-a716-446655440001', 329.99, 299.99, 40, true, false),
('750e8400-e29b-41d4-a716-446655440016', 'Sennheiser HD 660S', 'sennheiser-hd-660s', 'Audiophile open-back headphones with natural sound reproduction and premium build quality.', 'Audiophile open-back headphones', 'TECH-HP-016', '550e8400-e29b-41d4-a716-446655440014', '650e8400-e29b-41d4-a716-446655440001', 499.99, 449.99, 30, true, false);

-- Electronics - Smartwatches
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440017', 'Apple Watch Series 9', 'apple-watch-series-9', 'Advanced smartwatch with S9 chip, health monitoring, and always-on Retina display.', 'Advanced smartwatch with S9 chip', 'TECH-SW-017', '550e8400-e29b-41d4-a716-446655440015', '650e8400-e29b-41d4-a716-446655440001', 399.99, 379.99, 60, true, true),
('750e8400-e29b-41d4-a716-446655440018', 'Samsung Galaxy Watch 6 Classic', 'samsung-galaxy-watch-6-classic', 'Premium smartwatch with rotating bezel, health tracking, and Wear OS integration.', 'Premium smartwatch with rotating bezel', 'TECH-SW-018', '550e8400-e29b-41d4-a716-446655440015', '650e8400-e29b-41d4-a716-446655440001', 369.99, 329.99, 45, true, true),
('750e8400-e29b-41d4-a716-446655440019', 'Garmin Fenix 7', 'garmin-fenix-7', 'Rugged multisport GPS smartwatch with advanced training metrics and solar charging.', 'Rugged multisport GPS smartwatch', 'TECH-SW-019', '550e8400-e29b-41d4-a716-446655440015', '650e8400-e29b-41d4-a716-446655440001', 699.99, 649.99, 25, true, false),
('750e8400-e29b-41d4-a716-446655440020', 'Fitbit Versa 4', 'fitbit-versa-4', 'Fitness-focused smartwatch with built-in GPS, heart rate monitoring, and 6+ day battery life.', 'Fitness-focused smartwatch with GPS', 'TECH-SW-020', '550e8400-e29b-41d4-a716-446655440015', '650e8400-e29b-41d4-a716-446655440001', 199.99, 179.99, 80, true, false);

























