-- Fix Finance Function Permissions
-- This migration grants proper permissions to the finance functions that were missing GRANT statements

-- Drop existing functions if they exist to avoid return type conflicts
DROP FUNCTION IF EXISTS get_vendor_commission_revenue_breakdown(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_vendor_commission_revenue_details(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_realtime_finance_summary();
DROP FUNCTION IF EXISTS get_vendor_performance_metrics(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_daily_sales_breakdown(DATE, DATE);

-- First, ensure the function exists by creating it if it doesn't
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
    COALESCE(vp.business_name::TEXT, 'Unknown Vendor') as business_name,
    COALESCE(SUM(vc.order_amount), 0) as total_sales,
    COALESCE(SUM(vc.admin_amount), 0) as total_commission_revenue,
    COUNT(DISTINCT vc.order_id) as total_orders,
    COALESCE(AVG(vc.order_amount), 0) as average_order_value,
    COALESCE(vp.commission_rate, 0) as commission_rate,
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

-- Create a simpler version of the function for better compatibility
CREATE OR REPLACE FUNCTION get_vendor_commission_revenue_breakdown_simple(
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
    vc.vendor_id,
    COALESCE(vp.business_name::TEXT, 'Unknown Vendor') as business_name,
    COALESCE(SUM(vc.order_amount), 0) as total_sales,
    COALESCE(SUM(vc.admin_amount), 0) as total_commission_revenue,
    COUNT(DISTINCT vc.order_id) as total_orders,
    COALESCE(AVG(vc.order_amount), 0) as average_order_value,
    COALESCE(AVG(vc.commission_rate), 0) as commission_rate,
    MAX(vc.created_at) as last_sale_date
  FROM vendor_commissions vc
  LEFT JOIN vendor_profiles vp ON vp.id = vc.vendor_id
  WHERE (vendor_uuid IS NULL OR vc.vendor_id = vendor_uuid)
    AND (start_date IS NULL OR vc.created_at::date >= start_date)
    AND (end_date IS NULL OR vc.created_at::date <= end_date)
    AND (vp.status = 'active' OR vp.status IS NULL)
  GROUP BY vc.vendor_id, vp.business_name
  ORDER BY total_commission_revenue DESC;
END;
$$;

-- Grant permissions to get_vendor_commission_revenue_breakdown function
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown(UUID, DATE, DATE) TO service_role;

-- Grant permissions to the simple function
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown_simple(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown_simple(UUID, DATE, DATE) TO service_role;

-- Create get_vendor_commission_revenue_details function if it doesn't exist
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
  average_order_value DECIMAL(10,2),
  commission_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name::TEXT as product_name,
    COALESCE(SUM(vc.order_amount), 0) as total_sales,
    COALESCE(SUM(vc.admin_amount), 0) as total_commission_revenue,
    COUNT(DISTINCT vc.order_id) as total_orders,
    COALESCE(AVG(vc.order_amount), 0) as average_order_value,
    vc.commission_rate
  FROM products p
  LEFT JOIN vendor_commissions vc ON vc.product_id = p.id
  WHERE p.vendor_id = vendor_uuid
    AND (start_date IS NULL OR vc.created_at::date >= start_date)
    AND (end_date IS NULL OR vc.created_at::date <= end_date)
  GROUP BY p.id, p.name, vc.commission_rate
  ORDER BY total_commission_revenue DESC;
END;
$$;

-- Create get_realtime_finance_summary function if it doesn't exist
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
    COALESCE(SUM(CASE WHEN vc.status = 'pending' THEN vc.commission_amount ELSE 0 END), 0) as pending_payouts,
    COUNT(DISTINCT vp.id) as total_vendors_active
  FROM orders o
  LEFT JOIN vendor_commissions vc ON vc.order_id = o.id
  LEFT JOIN vendor_profiles vp ON vp.id = vc.vendor_id
  WHERE o.created_at::date = CURRENT_DATE
    AND o.status IN ('delivered', 'completed')
    AND vp.status = 'active';
END;
$$;

-- Create get_vendor_performance_metrics function if it doesn't exist
CREATE OR REPLACE FUNCTION get_vendor_performance_metrics(
  vendor_uuid UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  vendor_id UUID,
  business_name TEXT,
  total_sales DECIMAL(12,2),
  total_orders BIGINT,
  total_commission DECIMAL(12,2),
  pending_commission DECIMAL(12,2),
  commission_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id as vendor_id,
    vp.business_name::TEXT,
    COALESCE(SUM(vc.order_amount), 0) as total_sales,
    COUNT(DISTINCT vc.order_id) as total_orders,
    COALESCE(SUM(vc.commission_amount), 0) as total_commission,
    COALESCE(SUM(CASE WHEN vc.status = 'pending' THEN vc.commission_amount ELSE 0 END), 0) as pending_commission,
    vp.commission_rate
  FROM vendor_profiles vp
  LEFT JOIN vendor_commissions vc ON vc.vendor_id = vp.id
  WHERE (vendor_uuid IS NULL OR vp.id = vendor_uuid)
    AND vc.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    AND vp.status = 'active'
  GROUP BY vp.id, vp.business_name, vp.commission_rate
  ORDER BY total_sales DESC;
END;
$$;

-- Create get_daily_sales_breakdown function if it doesn't exist
CREATE OR REPLACE FUNCTION get_daily_sales_breakdown(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  sale_date DATE,
  total_orders BIGINT,
  total_revenue DECIMAL(12,2),
  total_commissions DECIMAL(12,2),
  admin_revenue DECIMAL(12,2)
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
    COALESCE(SUM(vc.commission_amount), 0) as total_commissions,
    COALESCE(SUM(vc.admin_amount), 0) as admin_revenue
  FROM orders o
  LEFT JOIN vendor_commissions vc ON vc.order_id = o.id
  WHERE o.created_at::date BETWEEN start_date AND end_date
    AND o.status IN ('delivered', 'completed')
  GROUP BY o.created_at::date
  ORDER BY sale_date DESC;
END;
$$;

-- Grant permissions to get_vendor_commission_revenue_details function
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_details(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_details(UUID, DATE, DATE) TO service_role;

-- Grant permissions to get_realtime_finance_summary function
GRANT EXECUTE ON FUNCTION get_realtime_finance_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_finance_summary() TO service_role;

-- Grant permissions to get_vendor_performance_metrics function
GRANT EXECUTE ON FUNCTION get_vendor_performance_metrics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_performance_metrics(UUID, INTEGER) TO service_role;

-- Grant permissions to get_daily_sales_breakdown function
GRANT EXECUTE ON FUNCTION get_daily_sales_breakdown(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_sales_breakdown(DATE, DATE) TO service_role;

-- Grant permissions to calculate_order_commissions function
GRANT EXECUTE ON FUNCTION calculate_order_commissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_order_commissions(UUID) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION get_vendor_commission_revenue_breakdown(UUID, DATE, DATE) IS 'Get commission revenue breakdown by vendor with optional filters';
COMMENT ON FUNCTION get_vendor_commission_revenue_details(UUID, DATE, DATE) IS 'Get detailed commission revenue by vendor with product breakdown';
COMMENT ON FUNCTION get_realtime_finance_summary() IS 'Get real-time finance summary for today';
COMMENT ON FUNCTION get_vendor_performance_metrics(UUID, INTEGER) IS 'Get vendor performance metrics with optional vendor filter and days back';
COMMENT ON FUNCTION get_daily_sales_breakdown(DATE, DATE) IS 'Get daily sales breakdown for specified date range';
COMMENT ON FUNCTION calculate_order_commissions(UUID) IS 'Calculate and store commission data for an order';
