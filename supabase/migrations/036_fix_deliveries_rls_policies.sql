-- Fix Deliveries RLS Policies
-- This migration adds the missing RLS policies for deliveries table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own deliveries" ON deliveries;
DROP POLICY IF EXISTS "Users can create deliveries for their orders" ON deliveries;
DROP POLICY IF EXISTS "Staff can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Staff can manage all deliveries" ON deliveries;

-- Create comprehensive RLS policies for deliveries table
CREATE POLICY "Users can view their own deliveries" ON deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = deliveries.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deliveries for their orders" ON deliveries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE id = deliveries.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own deliveries" ON deliveries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = deliveries.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all deliveries" ON deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can manage all deliveries" ON deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- Add comment for documentation
COMMENT ON TABLE deliveries IS 'Tracks delivery information for orders including tracking numbers and status';

