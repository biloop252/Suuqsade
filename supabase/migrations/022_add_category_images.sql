-- Add image support to categories
ALTER TABLE categories ADD COLUMN image_url TEXT;

-- Add some sample category images
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Electronics';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Clothing';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Home & Garden';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Sports';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Books';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Beauty';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Toys';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' WHERE name = 'Automotive';





