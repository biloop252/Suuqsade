-- Fashion - Clothing
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, price, sale_price, stock_quantity, is_active, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440021', 'Premium Cotton T-Shirt', 'premium-cotton-t-shirt', 'Soft, comfortable cotton t-shirt made from 100% organic cotton. Perfect for everyday wear with a relaxed fit.', 'Soft, comfortable organic cotton t-shirt', 'FASH-CL-021', '550e8400-e29b-41d4-a716-446655440021', '650e8400-e29b-41d4-a716-446655440002', 29.99, 24.99, 100, true, true),
('750e8400-e29b-41d4-a716-446655440022', 'Classic Denim Jeans', 'classic-denim-jeans', 'Timeless denim jeans with a classic straight fit. Made from premium denim with comfortable stretch.', 'Timeless denim jeans with classic fit', 'FASH-CL-022', '550e8400-e29b-41d4-a716-446655440021', '650e8400-e29b-41d4-a716-446655440002', 89.99, 79.99, 75, true, true),
('750e8400-e29b-41d4-a716-446655440023', 'Wool Blend Sweater', 'wool-blend-sweater', 'Cozy wool blend sweater perfect for cold weather. Features a relaxed fit and ribbed cuffs.', 'Cozy wool blend sweater for cold weather', 'FASH-CL-023', '550e8400-e29b-41d4-a716-446655440021', '650e8400-e29b-41d4-a716-446655440002', 79.99, 69.99, 50, true, false),
('750e8400-e29b-41d4-a716-446655440024', 'Casual Hoodie', 'casual-hoodie', 'Comfortable pullover hoodie with kangaroo pocket and adjustable drawstring hood.', 'Comfortable pullover hoodie with pocket', 'FASH-CL-024', '550e8400-e29b-41d4-a716-446655440021', '650e8400-e29b-41d4-a716-446655440002', 59.99, 49.99, 80, true, false),

-- Fashion - Shoes
('750e8400-e29b-41d4-a716-446655440025', 'Leather Dress Shoes', 'leather-dress-shoes', 'Classic leather dress shoes with Goodyear welt construction. Perfect for formal occasions.', 'Classic leather dress shoes', 'FASH-SH-025', '550e8400-e29b-41d4-a716-446655440022', '650e8400-e29b-41d4-a716-446655440002', 199.99, 179.99, 40, true, true),
('750e8400-e29b-41d4-a716-446655440026', 'Running Sneakers', 'running-sneakers', 'High-performance running shoes with responsive cushioning and breathable mesh upper.', 'High-performance running shoes', 'FASH-SH-026', '550e8400-e29b-41d4-a716-446655440022', '650e8400-e29b-41d4-a716-446655440002', 129.99, 109.99, 60, true, true),
('750e8400-e29b-41d4-a716-446655440027', 'Canvas Sneakers', 'canvas-sneakers', 'Classic canvas sneakers with rubber sole. Timeless design perfect for casual wear.', 'Classic canvas sneakers', 'FASH-SH-027', '550e8400-e29b-41d4-a716-446655440022', '650e8400-e29b-41d4-a716-446655440002', 69.99, 59.99, 90, true, false),
('750e8400-e29b-41d4-a716-446655440028', 'Ankle Boots', 'ankle-boots', 'Stylish ankle boots with genuine leather upper and comfortable cushioned insole.', 'Stylish leather ankle boots', 'FASH-SH-028', '550e8400-e29b-41d4-a716-446655440022', '650e8400-e29b-41d4-a716-446655440002', 149.99, 129.99, 35, true, false),

-- Fashion - Accessories
('750e8400-e29b-41d4-a716-446655440029', 'Leather Wallet', 'leather-wallet', 'Premium leather wallet with multiple card slots and RFID blocking technology.', 'Premium leather wallet with RFID blocking', 'FASH-AC-029', '550e8400-e29b-41d4-a716-446655440023', '650e8400-e29b-41d4-a716-446655440002', 79.99, 69.99, 70, true, true),
('750e8400-e29b-41d4-a716-446655440030', 'Silk Scarf', 'silk-scarf', 'Luxurious silk scarf with beautiful pattern. Perfect accessory for any outfit.', 'Luxurious silk scarf with beautiful pattern', 'FASH-AC-030', '550e8400-e29b-41d4-a716-446655440023', '650e8400-e29b-41d4-a716-446655440002', 49.99, 39.99, 55, true, true),
('750e8400-e29b-41d4-a716-446655440031', 'Leather Belt', 'leather-belt', 'Classic leather belt with brass buckle. Available in multiple sizes and colors.', 'Classic leather belt with brass buckle', 'FASH-AC-031', '550e8400-e29b-41d4-a716-446655440023', '650e8400-e29b-41d4-a716-446655440002', 59.99, 49.99, 65, true, false),
('750e8400-e29b-41d4-a716-446655440032', 'Sunglasses', 'sunglasses', 'UV-protective sunglasses with polarized lenses and lightweight frame design.', 'UV-protective polarized sunglasses', 'FASH-AC-032', '550e8400-e29b-41d4-a716-446655440023', '650e8400-e29b-41d4-a716-446655440002', 89.99, 79.99, 45, true, false),

-- Fashion - Bags
('750e8400-e29b-41d4-a716-446655440033', 'Leather Handbag', 'leather-handbag', 'Elegant leather handbag with multiple compartments and adjustable shoulder strap.', 'Elegant leather handbag with compartments', 'FASH-BG-033', '550e8400-e29b-41d4-a716-446655440024', '650e8400-e29b-41d4-a716-446655440002', 199.99, 179.99, 30, true, true),
('750e8400-e29b-41d4-a716-446655440034', 'Canvas Backpack', 'canvas-backpack', 'Durable canvas backpack with laptop compartment and multiple pockets for organization.', 'Durable canvas backpack with laptop compartment', 'FASH-BG-034', '550e8400-e29b-41d4-a716-446655440024', '650e8400-e29b-41d4-a716-446655440002', 89.99, 79.99, 50, true, true),
('750e8400-e29b-41d4-a716-446655440035', 'Crossbody Bag', 'crossbody-bag', 'Compact crossbody bag perfect for everyday essentials. Features adjustable strap and secure closure.', 'Compact crossbody bag for essentials', 'FASH-BG-035', '550e8400-e29b-41d4-a716-446655440024', '650e8400-e29b-41d4-a716-446655440002', 69.99, 59.99, 60, true, false),
('750e8400-e29b-41d4-a716-446655440036', 'Travel Duffel Bag', 'travel-duffel-bag', 'Spacious travel duffel bag with reinforced handles and water-resistant material.', 'Spacious water-resistant travel duffel', 'FASH-BG-036', '550e8400-e29b-41d4-a716-446655440024', '650e8400-e29b-41d4-a716-446655440002', 119.99, 99.99, 25, true, false);














































