-- Finance Integration Triggers
-- This migration creates triggers to automatically integrate finance tracking
-- when orders are placed and payments are processed

-- Function to handle order creation and trigger commission calculation
CREATE OR REPLACE FUNCTION handle_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the order creation for finance tracking
  INSERT INTO finance_transactions (
    transaction_type,
    order_id,
    user_id,
    amount,
    description,
    status
  ) VALUES (
    'sale_commission',
    NEW.id,
    NEW.user_id,
    NEW.total_amount,
    'Order created: ' || NEW.order_number,
    'pending'
  );

  RETURN NEW;
END;
$$;

-- Function to handle payment status changes
CREATE OR REPLACE FUNCTION handle_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If payment is marked as paid, trigger commission calculation
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Update the finance transaction status
    UPDATE finance_transactions 
    SET status = 'completed', processed_at = NOW()
    WHERE order_id = NEW.order_id AND transaction_type = 'sale_commission';
    
    -- Trigger commission calculation
    PERFORM calculate_order_commissions(NEW.order_id);
  END IF;

  -- If payment is marked as failed or refunded, update finance transactions
  IF NEW.status IN ('failed', 'refunded') THEN
    UPDATE finance_transactions 
    SET status = CASE 
      WHEN NEW.status = 'failed' THEN 'failed'
      WHEN NEW.status = 'refunded' THEN 'cancelled'
    END,
    processed_at = NOW()
    WHERE order_id = NEW.order_id;
    
    -- If refunded, also update commission status
    IF NEW.status = 'refunded' THEN
      UPDATE vendor_commissions 
      SET status = 'refunded'
      WHERE order_id = NEW.order_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to handle order status changes (for logging purposes only)
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log order status changes for audit purposes
  -- Commissions are now calculated when payment is marked as paid
  -- This function can be used for other order status related logic if needed
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS order_created_trigger ON orders;
CREATE TRIGGER order_created_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_created();

-- Drop the old commission trigger to avoid conflicts
DROP TRIGGER IF EXISTS calculate_commissions_trigger ON orders;

DROP TRIGGER IF EXISTS payment_status_change_trigger ON payments;
CREATE TRIGGER payment_status_change_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_status_change();

DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_change();

-- Function to get real-time finance summary for dashboard
CREATE OR REPLACE FUNCTION get_realtime_finance_summary()
RETURNS TABLE (
  total_orders_today BIGINT,
  total_revenue_today DECIMAL(12,2),
  total_commissions_today DECIMAL(12,2),
  admin_revenue_today DECIMAL(12,2),
  pending_payouts DECIMAL(12,2),
  total_vendors_active BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT o.id) as total_orders_today,
    COALESCE(SUM(o.total_amount), 0) as total_revenue_today,
    COALESCE(SUM(vc.commission_amount), 0) as total_commissions_today,
    COALESCE(SUM(vc.admin_amount), 0) as admin_revenue_today,
    COALESCE(SUM(CASE WHEN vp.status = 'pending' THEN vp.total_commission ELSE 0 END), 0) as pending_payouts,
    COUNT(DISTINCT vp.vendor_id) as total_vendors_active
  FROM orders o
  LEFT JOIN vendor_commissions vc ON o.id = vc.order_id
  LEFT JOIN vendor_payouts vp ON vc.vendor_id = vp.vendor_id
  WHERE o.created_at::date = CURRENT_DATE
    AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered');
END;
$$;

-- Function to get vendor performance metrics
CREATE OR REPLACE FUNCTION get_vendor_performance_metrics(
  vendor_uuid UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  vendor_id UUID,
  business_name TEXT,
  total_orders BIGINT,
  total_sales DECIMAL(12,2),
  total_commission DECIMAL(12,2),
  pending_commission DECIMAL(12,2),
  commission_rate DECIMAL(5,2),
  last_order_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id as vendor_id,
    vp.business_name,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(oi.total_price), 0) as total_sales,
    COALESCE(SUM(vc.commission_amount), 0) as total_commission,
    COALESCE(SUM(CASE WHEN vc.status = 'pending' THEN vc.commission_amount ELSE 0 END), 0) as pending_commission,
    vp.commission_rate,
    MAX(o.created_at) as last_order_date
  FROM vendor_profiles vp
  LEFT JOIN products p ON p.vendor_id = vp.id
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id
  LEFT JOIN vendor_commissions vc ON vc.order_id = o.id AND vc.vendor_id = vp.id
  WHERE (vendor_uuid IS NULL OR vp.id = vendor_uuid)
    AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    AND vp.status = 'active'
  GROUP BY vp.id, vp.business_name, vp.commission_rate
  ORDER BY total_sales DESC;
END;
$$;

-- Function to get daily sales breakdown
CREATE OR REPLACE FUNCTION get_daily_sales_breakdown(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  sale_date DATE,
  total_orders BIGINT,
  total_revenue DECIMAL(12,2),
  vendor_commissions DECIMAL(12,2),
  admin_commissions DECIMAL(12,2),
  average_order_value DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.created_at::date as sale_date,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(vc.commission_amount), 0) as vendor_commissions,
    COALESCE(SUM(vc.admin_amount), 0) as admin_commissions,
    COALESCE(AVG(o.total_amount), 0) as average_order_value
  FROM orders o
  LEFT JOIN vendor_commissions vc ON o.id = vc.order_id
  WHERE o.created_at::date BETWEEN start_date AND end_date
    AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
  GROUP BY o.created_at::date
  ORDER BY sale_date DESC;
END;
$$;

-- Create indexes for better performance on finance queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_order_vendor ON vendor_commissions(order_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_order_type ON finance_transactions(order_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_payments_order_status ON payments(order_id, status);

-- Function to get commission revenue breakdown by vendor
CREATE OR REPLACE FUNCTION get_vendor_commission_revenue_breakdown(
  vendor_uuid UUID DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  vendor_id UUID,
  business_name TEXT,
  total_sales DECIMAL(12,2),
  total_commission_revenue DECIMAL(12,2),
  total_orders BIGINT,
  average_order_value DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  last_sale_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id as vendor_id,
    vp.business_name,
    COALESCE(SUM(vc.order_amount), 0) as total_sales,
    COALESCE(SUM(vc.admin_amount), 0) as total_commission_revenue,
    COUNT(DISTINCT vc.order_id) as total_orders,
    COALESCE(AVG(vc.order_amount), 0) as average_order_value,
    vp.commission_rate,
    MAX(vc.created_at) as last_sale_date
  FROM vendor_profiles vp
  LEFT JOIN vendor_commissions vc ON vc.vendor_id = vp.id
  LEFT JOIN orders o ON o.id = vc.order_id
  WHERE (vendor_uuid IS NULL OR vp.id = vendor_uuid)
    AND (start_date IS NULL OR vc.created_at::date >= start_date)
    AND (end_date IS NULL OR vc.created_at::date <= end_date)
    AND vp.status = 'active'
  GROUP BY vp.id, vp.business_name, vp.commission_rate
  ORDER BY total_commission_revenue DESC;
END;
$$;

-- Function to get detailed commission revenue by vendor with product breakdown
CREATE OR REPLACE FUNCTION get_vendor_commission_revenue_details(
  vendor_uuid UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  total_sales DECIMAL(12,2),
  total_commission_revenue DECIMAL(12,2),
  total_orders BIGINT,
  average_sale_price DECIMAL(10,2),
  commission_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    COALESCE(SUM(vc.order_amount), 0) as total_sales,
    COALESCE(SUM(vc.admin_amount), 0) as total_commission_revenue,
    COUNT(DISTINCT vc.order_id) as total_orders,
    COALESCE(AVG(vc.order_amount), 0) as average_sale_price,
    vp.commission_rate
  FROM products p
  JOIN vendor_profiles vp ON p.vendor_id = vp.id
  LEFT JOIN vendor_commissions vc ON vc.product_id = p.id
  WHERE p.vendor_id = vendor_uuid
    AND (start_date IS NULL OR vc.created_at::date >= start_date)
    AND (end_date IS NULL OR vc.created_at::date <= end_date)
  GROUP BY p.id, p.name, vp.commission_rate
  ORDER BY total_commission_revenue DESC;
END;
$$;

-- Add some sample data for testing (optional - remove in production)
-- This creates a test order with commission tracking
DO $$
DECLARE
  test_order_id UUID;
  test_vendor_id UUID;
  test_product_id UUID;
BEGIN
  -- Get a test vendor and product (if they exist)
  SELECT id INTO test_vendor_id FROM vendor_profiles LIMIT 1;
  SELECT id INTO test_product_id FROM products WHERE vendor_id = test_vendor_id LIMIT 1;
  
  -- Only create test data if we have the required records
  IF test_vendor_id IS NOT NULL AND test_product_id IS NOT NULL THEN
    -- Create a test order
    INSERT INTO orders (
      order_number, user_id, status, total_amount, subtotal, 
      tax_amount, shipping_amount, discount_amount
    ) VALUES (
      'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
      (SELECT id FROM profiles LIMIT 1),
      'delivered',
      100.00,
      90.00,
      5.00,
      5.00,
      0.00
    ) RETURNING id INTO test_order_id;
    
    -- Create order item
    INSERT INTO order_items (
      order_id, product_id, product_name, quantity, unit_price, total_price
    ) VALUES (
      test_order_id, test_product_id, 'Test Product', 1, 100.00, 100.00
    );
    
    -- Create payment record
    INSERT INTO payments (
      order_id, amount, payment_method, status
    ) VALUES (
      test_order_id, 100.00, 'test', 'paid'
    );
    
    -- Trigger commission calculation
    PERFORM calculate_order_commissions(test_order_id);
  END IF;
END $$;
