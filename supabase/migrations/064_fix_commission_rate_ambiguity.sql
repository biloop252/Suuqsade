-- Fix Commission Rate Ambiguity
-- This migration fixes the ambiguous column reference in calculate_order_commissions function

-- Fix the calculate_order_commissions function to resolve column ambiguity
CREATE OR REPLACE FUNCTION calculate_order_commissions(order_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  order_item RECORD;
  vendor_record RECORD;
  vendor_commission_rate DECIMAL(5,2); -- Renamed to avoid ambiguity
  commission_amount DECIMAL(10,2);
  admin_amount DECIMAL(10,2);
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', order_uuid;
  END IF;

  -- Process each order item
  FOR order_item IN 
    SELECT oi.*, p.vendor_id 
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid
  LOOP
    -- Skip if no vendor (admin products)
    IF order_item.vendor_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Get vendor commission rate (using table alias to avoid ambiguity)
    SELECT vp.commission_rate INTO vendor_commission_rate
    FROM vendor_profiles vp
    WHERE vp.id = order_item.vendor_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendor profile not found for vendor: %', order_item.vendor_id;
    END IF;

    -- Calculate commission amounts
    -- vendor_commission_rate is the admin's percentage, so admin gets vendor_commission_rate% and vendor gets the rest
    admin_amount := (order_item.total_price * vendor_commission_rate) / 100;
    commission_amount := order_item.total_price - admin_amount;

    -- Insert commission record
    INSERT INTO vendor_commissions (
      order_id, vendor_id, order_item_id, product_id,
      commission_rate, order_amount, commission_amount, admin_amount,
      status
    ) VALUES (
      order_uuid, order_item.vendor_id, order_item.id, order_item.product_id,
      vendor_commission_rate, order_item.total_price, commission_amount, admin_amount,
      'pending'
    );

    -- Create finance transaction for vendor commission (what vendor earns)
    INSERT INTO finance_transactions (
      transaction_type, order_id, vendor_id, amount, description, status
    ) VALUES (
      'sale_commission', order_uuid, order_item.vendor_id, commission_amount,
      'Vendor commission for order ' || order_record.order_number, 'completed'
    );

    -- Create finance transaction for admin revenue (admin's commission)
    INSERT INTO finance_transactions (
      transaction_type, order_id, vendor_id, amount, description, status
    ) VALUES (
      'admin_revenue', order_uuid, order_item.vendor_id, admin_amount,
      'Admin commission from order ' || order_record.order_number, 'completed'
    );

    -- Update admin_revenues table
    INSERT INTO admin_revenues (
      revenue_type, source_id, source_type, amount, description
    ) VALUES (
      'commission', order_item.vendor_id, 'vendor', admin_amount,
      'Admin commission (' || vendor_commission_rate || '%) from vendor for order ' || order_record.order_number
    );

  END LOOP;
END;
$$;

-- Add a function to test commission calculation without triggering it
CREATE OR REPLACE FUNCTION test_commission_calculation(order_uuid UUID)
RETURNS TABLE (
  order_id UUID,
  vendor_id UUID,
  product_id UUID,
  order_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  vendor_commission DECIMAL(10,2),
  admin_commission DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.order_id,
    p.vendor_id,
    oi.product_id,
    oi.total_price as order_amount,
    vp.commission_rate,
    (oi.total_price * (100 - vp.commission_rate) / 100) as vendor_commission,
    (oi.total_price * vp.commission_rate / 100) as admin_commission
  FROM order_items oi
  LEFT JOIN products p ON oi.product_id = p.id
  LEFT JOIN vendor_profiles vp ON p.vendor_id = vp.id
  WHERE oi.order_id = order_uuid
    AND p.vendor_id IS NOT NULL;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION test_commission_calculation(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_order_commissions(UUID) IS 'Calculates and creates commission records for an order, fixed to resolve column ambiguity';
COMMENT ON FUNCTION test_commission_calculation(UUID) IS 'Test function to preview commission calculations without actually creating records';













