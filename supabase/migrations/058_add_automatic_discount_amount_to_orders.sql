-- Add missing discount columns to orders and order_items tables

-- Add discount columns to orders table
ALTER TABLE orders 
ADD COLUMN automatic_discount_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE orders 
ADD COLUMN product_discount_amount DECIMAL(10,2) DEFAULT 0;

-- Add discount columns to order_items table
ALTER TABLE order_items 
ADD COLUMN discounted_unit_price DECIMAL(10,2);

ALTER TABLE order_items 
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN orders.automatic_discount_amount IS 'Amount of automatic discount applied to the order';
COMMENT ON COLUMN orders.product_discount_amount IS 'Amount of product-level discounts applied to the order';
COMMENT ON COLUMN orders.discount_amount IS 'Amount of coupon discount applied to the order';

COMMENT ON COLUMN order_items.discounted_unit_price IS 'Unit price after applying product discounts';
COMMENT ON COLUMN order_items.discount_amount IS 'Total discount amount applied to this order item';
