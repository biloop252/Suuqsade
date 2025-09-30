-- Add missing INSERT policies for orders, order_items, and payments
-- This is a minimal fix to allow order creation

-- Add INSERT policy for orders table
CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for order_items table  
CREATE POLICY "Users can create order items for their orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

-- Add INSERT policy for payments table
CREATE POLICY "Users can create payments for their orders" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE id = payments.order_id AND user_id = auth.uid()
    )
  );

-- Add INSERT policy for addresses table
CREATE POLICY "Users can create their own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

