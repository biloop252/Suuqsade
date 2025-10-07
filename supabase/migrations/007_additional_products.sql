-- Sample Products (Books)
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440033', 'Programming Fundamentals', 'programming-fundamentals', 'Comprehensive guide to programming fundamentals covering multiple languages. Perfect for beginners and intermediate developers.', 'Comprehensive programming guide for beginners', 'BOOK-PF-033', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', 49.99, 39.99, 50, true, true),
('750e8400-e29b-41d4-a716-446655440034', 'Cookbook: Healthy Recipes', 'cookbook-healthy-recipes', 'Collection of 200+ healthy and delicious recipes with nutritional information. Perfect for home cooks looking to eat better.', '200+ healthy and delicious recipes', 'BOOK-CR-034', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', 29.99, 24.99, 80, true, false),
('750e8400-e29b-41d4-a716-446655440035', 'Mystery Novel: The Lost City', 'mystery-novel-lost-city', 'Bestselling mystery novel about an archaeologist searching for a lost ancient city. Gripping plot with unexpected twists.', 'Bestselling mystery novel with gripping plot', 'BOOK-MN-035', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', 19.99, 15.99, 60, true, false),
('750e8400-e29b-41d4-a716-446655440036', 'Children''s Picture Book', 'childrens-picture-book', 'Beautifully illustrated children''s book with engaging story and colorful artwork. Perfect for bedtime reading.', 'Beautifully illustrated children''s book', 'BOOK-CP-036', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', 14.99, 11.99, 100, true, false),
('750e8400-e29b-41d4-a716-446655440037', 'Business Strategy Guide', 'business-strategy-guide', 'Expert guide to business strategy and management. Covers planning, execution, and growth strategies for modern businesses.', 'Expert guide to business strategy', 'BOOK-BS-037', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', 39.99, 29.99, 40, true, false),
('750e8400-e29b-41d4-a716-446655440038', 'Science Fiction Collection', 'science-fiction-collection', 'Collection of award-winning science fiction short stories. Features works from renowned authors in the genre.', 'Collection of award-winning sci-fi stories', 'BOOK-SF-038', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', 24.99, 19.99, 70, true, false);

-- Sample Products (Beauty & Personal Care)
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440039', 'Anti-Aging Serum', 'anti-aging-serum', 'Premium anti-aging serum with vitamin C and hyaluronic acid. Reduces fine lines and improves skin texture. Dermatologist tested.', 'Premium anti-aging serum with vitamin C', 'BEAUTY-AS-039', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 79.99, 59.99, 45, true, true),
('750e8400-e29b-41d4-a716-446655440040', 'Moisturizing Face Cream', 'moisturizing-face-cream', 'Hydrating face cream with natural ingredients. Suitable for all skin types. Provides 24-hour moisture and protection.', 'Hydrating face cream for all skin types', 'BEAUTY-MC-040', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 34.99, 24.99, 80, true, false),
('750e8400-e29b-41d4-a716-446655440041', 'Shampoo & Conditioner Set', 'shampoo-conditioner-set', 'Professional hair care set with sulfate-free formula. Nourishes and strengthens hair while adding shine and volume.', 'Professional sulfate-free hair care set', 'BEAUTY-SC-041', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 29.99, 19.99, 90, true, false),
('750e8400-e29b-41d4-a716-446655440042', 'Makeup Brush Set', 'makeup-brush-set', 'Complete makeup brush set with 12 professional brushes. Soft synthetic bristles and ergonomic handles for perfect application.', 'Complete professional makeup brush set', 'BEAUTY-MB-042', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 49.99, 34.99, 60, true, false),
('750e8400-e29b-41d4-a716-446655440043', 'Lipstick Collection', 'lipstick-collection', 'Set of 6 matte lipsticks in various shades. Long-lasting formula with rich color payoff. Cruelty-free and vegan.', 'Set of 6 long-lasting matte lipsticks', 'BEAUTY-LC-043', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 39.99, 29.99, 55, true, false),
('750e8400-e29b-41d4-a716-446655440044', 'Body Lotion', 'body-lotion', 'Nourishing body lotion with shea butter and vitamin E. Absorbs quickly and leaves skin soft and smooth all day.', 'Nourishing body lotion with shea butter', 'BEAUTY-BL-044', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 19.99, 14.99, 100, true, false),
('750e8400-e29b-41d4-a716-446655440045', 'Perfume Eau de Parfum', 'perfume-eau-de-parfum', 'Elegant eau de parfum with floral and woody notes. Long-lasting fragrance perfect for special occasions.', 'Elegant long-lasting eau de parfum', 'BEAUTY-PE-045', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 89.99, 69.99, 35, true, false),
('750e8400-e29b-41d4-a716-446655440046', 'Nail Polish Set', 'nail-polish-set', 'Set of 8 nail polishes in trendy colors. Quick-dry formula with high shine finish. Chip-resistant and long-lasting.', 'Set of 8 quick-dry nail polishes', 'BEAUTY-NP-046', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', 24.99, 17.99, 75, true, false);































