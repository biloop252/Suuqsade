-- Books - Various Genres
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440061', 'Programming Fundamentals', 'programming-fundamentals', 'Comprehensive guide to programming fundamentals covering multiple languages. Perfect for beginners and intermediate developers.', 'Comprehensive programming guide for beginners', 'BOOK-VG-061', '550e8400-e29b-41d4-a716-446655440051', '650e8400-e29b-41d4-a716-446655440005', 49.99, 39.99, 50, true, true),
('750e8400-e29b-41d4-a716-446655440062', 'Mystery Novel Collection', 'mystery-novel-collection', 'Collection of bestselling mystery novels with gripping plots and unexpected twists.', 'Collection of bestselling mystery novels', 'BOOK-VG-062', '550e8400-e29b-41d4-a716-446655440051', '650e8400-e29b-41d4-a716-446655440005', 29.99, 24.99, 60, true, true),
('750e8400-e29b-41d4-a716-446655440063', 'Science Fiction Anthology', 'science-fiction-anthology', 'Award-winning science fiction short stories from renowned authors in the genre.', 'Award-winning science fiction anthology', 'BOOK-VG-063', '550e8400-e29b-41d4-a716-446655440051', '650e8400-e29b-41d4-a716-446655440005', 24.99, 19.99, 70, true, false),
('750e8400-e29b-41d4-a716-446655440064', 'Business Strategy Guide', 'business-strategy-guide', 'Expert guide to business strategy and management. Covers planning, execution, and growth strategies.', 'Expert guide to business strategy', 'BOOK-VG-064', '550e8400-e29b-41d4-a716-446655440051', '650e8400-e29b-41d4-a716-446655440005', 39.99, 29.99, 40, true, false),

-- Books - Formats
('750e8400-e29b-41d4-a716-446655440065', 'Hardcover Classic Collection', 'hardcover-classic-collection', 'Beautiful hardcover collection of classic literature with gold-embossed covers.', 'Hardcover collection of classic literature', 'BOOK-FM-065', '550e8400-e29b-41d4-a716-446655440052', '650e8400-e29b-41d4-a716-446655440005', 79.99, 69.99, 25, true, true),
('750e8400-e29b-41d4-a716-446655440066', 'Audiobook Collection', 'audiobook-collection', 'Digital audiobook collection with professional narration and high-quality audio.', 'Digital audiobook collection with narration', 'BOOK-FM-066', '550e8400-e29b-41d4-a716-446655440052', '650e8400-e29b-41d4-a716-446655440005', 34.99, 24.99, 100, true, true),
('750e8400-e29b-41d4-a716-446655440067', 'E-Book Bundle', 'e-book-bundle', 'Digital e-book bundle with instant download and multiple format compatibility.', 'Digital e-book bundle with instant download', 'BOOK-FM-067', '550e8400-e29b-41d4-a716-446655440052', '650e8400-e29b-41d4-a716-446655440005', 19.99, 14.99, 200, true, false),
('750e8400-e29b-41d4-a716-446655440068', 'Children''s Picture Book', 'childrens-picture-book', 'Beautifully illustrated children''s book with engaging story and colorful artwork.', 'Beautifully illustrated children''s book', 'BOOK-FM-068', '550e8400-e29b-41d4-a716-446655440052', '650e8400-e29b-41d4-a716-446655440005', 14.99, 11.99, 80, true, false),

-- Beauty - Skincare
('750e8400-e29b-41d4-a716-446655440069', 'Anti-Aging Serum', 'anti-aging-serum', 'Premium anti-aging serum with vitamin C and hyaluronic acid. Reduces fine lines and improves skin texture.', 'Premium anti-aging serum with vitamin C', 'BEAUTY-SK-069', '550e8400-e29b-41d4-a716-446655440061', '650e8400-e29b-41d4-a716-446655440006', 79.99, 69.99, 45, true, true),
('750e8400-e29b-41d4-a716-446655440070', 'Moisturizing Face Cream', 'moisturizing-face-cream', 'Hydrating face cream with natural ingredients. Suitable for all skin types with 24-hour moisture.', 'Hydrating face cream for all skin types', 'BEAUTY-SK-070', '550e8400-e29b-41d4-a716-446655440061', '650e8400-e29b-41d4-a716-446655440006', 34.99, 29.99, 80, true, true),
('750e8400-e29b-41d4-a716-446655440071', 'Facial Cleanser', 'facial-cleanser', 'Gentle facial cleanser that removes dirt and makeup while maintaining skin''s natural moisture balance.', 'Gentle facial cleanser for all skin types', 'BEAUTY-SK-071', '550e8400-e29b-41d4-a716-446655440061', '650e8400-e29b-41d4-a716-446655440006', 24.99, 19.99, 90, true, false),
('750e8400-e29b-41d4-a716-446655440072', 'Eye Cream', 'eye-cream', 'Anti-aging eye cream that reduces puffiness and dark circles while hydrating delicate eye area.', 'Anti-aging eye cream for dark circles', 'BEAUTY-SK-072', '550e8400-e29b-41d4-a716-446655440061', '650e8400-e29b-41d4-a716-446655440006', 49.99, 39.99, 60, true, false),

-- Beauty - Makeup
('750e8400-e29b-41d4-a716-446655440073', 'Foundation Set', 'foundation-set', 'Complete foundation set with primer, foundation, and setting powder. Long-lasting coverage for all day wear.', 'Complete foundation set with primer', 'BEAUTY-MK-073', '550e8400-e29b-41d4-a716-446655440062', '650e8400-e29b-41d4-a716-446655440006', 89.99, 79.99, 35, true, true),
('750e8400-e29b-41d4-a716-446655440074', 'Lipstick Collection', 'lipstick-collection', 'Set of 6 matte lipsticks in various shades. Long-lasting formula with rich color payoff.', 'Set of 6 long-lasting matte lipsticks', 'BEAUTY-MK-074', '550e8400-e29b-41d4-a716-446655440062', '650e8400-e29b-41d4-a716-446655440006', 39.99, 34.99, 55, true, true),
('750e8400-e29b-41d4-a716-446655440075', 'Eyeshadow Palette', 'eyeshadow-palette', 'Professional eyeshadow palette with 12 shades. Blendable formula with matte and shimmer finishes.', 'Professional 12-shade eyeshadow palette', 'BEAUTY-MK-075', '550e8400-e29b-41d4-a716-446655440062', '650e8400-e29b-41d4-a716-446655440006', 59.99, 49.99, 40, true, false),
('750e8400-e29b-41d4-a716-446655440076', 'Makeup Brush Set', 'makeup-brush-set', 'Complete makeup brush set with 12 professional brushes. Soft synthetic bristles for perfect application.', 'Complete professional makeup brush set', 'BEAUTY-MK-076', '550e8400-e29b-41d4-a716-446655440062', '650e8400-e29b-41d4-a716-446655440006', 49.99, 39.99, 50, true, false),

-- Beauty - Personal Care Items
('750e8400-e29b-41d4-a716-446655440077', 'Shampoo & Conditioner Set', 'shampoo-conditioner-set', 'Professional hair care set with sulfate-free formula. Nourishes and strengthens hair.', 'Professional sulfate-free hair care set', 'BEAUTY-PC-077', '550e8400-e29b-41d4-a716-446655440063', '650e8400-e29b-41d4-a716-446655440006', 29.99, 24.99, 70, true, true),
('750e8400-e29b-41d4-a716-446655440078', 'Body Lotion', 'body-lotion', 'Nourishing body lotion with shea butter and vitamin E. Absorbs quickly and leaves skin soft.', 'Nourishing body lotion with shea butter', 'BEAUTY-PC-078', '550e8400-e29b-41d4-a716-446655440063', '650e8400-e29b-41d4-a716-446655440006', 19.99, 16.99, 85, true, true),
('750e8400-e29b-41d4-a716-446655440079', 'Toothbrush Set', 'toothbrush-set', 'Electric toothbrush set with multiple brush heads and charging base. Advanced cleaning technology.', 'Electric toothbrush set with charging base', 'BEAUTY-PC-079', '550e8400-e29b-41d4-a716-446655440063', '650e8400-e29b-41d4-a716-446655440006', 79.99, 69.99, 30, true, false),
('750e8400-e29b-41d4-a716-446655440080', 'Deodorant Set', 'deodorant-set', 'Natural deodorant set with aluminum-free formula. Long-lasting protection with fresh scent.', 'Natural aluminum-free deodorant set', 'BEAUTY-PC-080', '550e8400-e29b-41d4-a716-446655440063', '650e8400-e29b-41d4-a716-446655440006', 24.99, 19.99, 75, true, false);


































