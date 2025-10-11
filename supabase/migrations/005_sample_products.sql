-- Sample Products (Electronics)
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Smartphone Pro Max', 'smartphone-pro-max', 'Latest flagship smartphone with advanced camera system, 5G connectivity, and all-day battery life. Features a stunning 6.7-inch OLED display and professional-grade photography capabilities.', 'Latest flagship smartphone with advanced features', 'TECH-SM-001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 999.99, 899.99, 50, true, true),
('750e8400-e29b-41d4-a716-446655440002', 'Wireless Bluetooth Headphones', 'wireless-bluetooth-headphones', 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for music lovers and professionals.', 'Premium wireless headphones with noise cancellation', 'TECH-HP-002', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 299.99, 249.99, 75, true, true),
('750e8400-e29b-41d4-a716-446655440003', '4K Ultra HD Smart TV', '4k-ultra-hd-smart-tv', '55-inch 4K Ultra HD Smart TV with HDR support, built-in streaming apps, and voice control. Experience cinema-quality entertainment in your living room.', '55-inch 4K Smart TV with HDR', 'TECH-TV-003', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 799.99, 699.99, 25, true, false),
('750e8400-e29b-41d4-a716-446655440004', 'Gaming Laptop Pro', 'gaming-laptop-pro', 'High-performance gaming laptop with RTX graphics, 16GB RAM, and 1TB SSD. Built for serious gamers and content creators.', 'High-performance gaming laptop', 'TECH-LP-004', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 1599.99, 1399.99, 15, true, true),
('750e8400-e29b-41d4-a716-446655440005', 'Smart Watch Series 8', 'smart-watch-series-8', 'Advanced smartwatch with health monitoring, GPS, and water resistance. Track your fitness goals and stay connected on the go.', 'Advanced smartwatch with health monitoring', 'TECH-SW-005', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 399.99, 349.99, 60, true, false),
('750e8400-e29b-41d4-a716-446655440006', 'Tablet Air 10', 'tablet-air-10', 'Lightweight 10-inch tablet with powerful processor, all-day battery life, and stunning display. Perfect for work, entertainment, and creativity.', 'Lightweight 10-inch tablet', 'TECH-TB-006', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 599.99, 549.99, 40, true, false),
('750e8400-e29b-41d4-a716-446655440007', 'Wireless Charging Pad', 'wireless-charging-pad', 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator and safety features.', 'Fast wireless charging pad', 'TECH-WC-007', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 49.99, 39.99, 100, true, false),
('750e8400-e29b-41d4-a716-446655440008', 'Bluetooth Speaker', 'bluetooth-speaker', 'Portable Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life. Perfect for outdoor adventures.', 'Portable waterproof Bluetooth speaker', 'TECH-BS-008', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 129.99, 99.99, 80, true, false);

-- Sample Products (Fashion)
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440009', 'Classic Denim Jacket', 'classic-denim-jacket', 'Timeless denim jacket made from premium cotton denim. Features a classic fit, button closure, and multiple pockets. Perfect for layering.', 'Timeless denim jacket in classic fit', 'FASH-DJ-009', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 89.99, 69.99, 45, true, true),
('750e8400-e29b-41d4-a716-446655440010', 'Premium Leather Boots', 'premium-leather-boots', 'Handcrafted leather boots with genuine leather upper, cushioned insole, and durable rubber sole. Built to last and perfect for any occasion.', 'Handcrafted leather boots', 'FASH-LB-010', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 199.99, 159.99, 30, true, true),
('750e8400-e29b-41d4-a716-446655440011', 'Designer Handbag', 'designer-handbag', 'Elegant designer handbag made from premium materials. Features multiple compartments, adjustable strap, and timeless design.', 'Elegant designer handbag', 'FASH-HB-011', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 299.99, 249.99, 20, true, false),
('750e8400-e29b-41d4-a716-446655440012', 'Casual T-Shirt Pack', 'casual-t-shirt-pack', 'Pack of 3 premium cotton t-shirts in various colors. Soft, comfortable, and perfect for everyday wear. Machine washable.', 'Pack of 3 premium cotton t-shirts', 'FASH-TS-012', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 39.99, 29.99, 100, true, false),
('750e8400-e29b-41d4-a716-446655440013', 'Wool Blend Sweater', 'wool-blend-sweater', 'Cozy wool blend sweater perfect for cold weather. Features a relaxed fit, ribbed cuffs, and classic crew neck design.', 'Cozy wool blend sweater', 'FASH-WS-013', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 79.99, 59.99, 35, true, false),
('750e8400-e29b-41d4-a716-446655440014', 'Running Sneakers', 'running-sneakers', 'High-performance running sneakers with breathable mesh upper, cushioned sole, and excellent traction. Perfect for athletes and casual wear.', 'High-performance running sneakers', 'FASH-RS-014', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 129.99, 99.99, 50, true, false),
('750e8400-e29b-41d4-a716-446655440015', 'Silk Scarf', 'silk-scarf', 'Luxurious silk scarf with beautiful pattern. Perfect accessory for any outfit. Hand-washable and wrinkle-resistant.', 'Luxurious silk scarf', 'FASH-SS-015', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 49.99, 39.99, 60, true, false),
('750e8400-e29b-41d4-a716-446655440016', 'Winter Coat', 'winter-coat', 'Warm winter coat with water-resistant outer shell and insulated lining. Features hood, multiple pockets, and adjustable cuffs.', 'Warm water-resistant winter coat', 'FASH-WC-016', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 179.99, 149.99, 25, true, false);






































