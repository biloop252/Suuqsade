-- Fix data type issues in finance functions
-- This script fixes the "character varying does not match expected type text" error

-- Fix get_vendor_commission_revenue_breakdown function
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

-- Fix get_vendor_commission_revenue_breakdown_simple function
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

-- Fix get_vendor_performance_metrics function
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

-- Fix get_vendor_commission_revenue_details function
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown_simple(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_breakdown_simple(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION get_vendor_performance_metrics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_performance_metrics(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_details(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_commission_revenue_details(UUID, DATE, DATE) TO service_role;

-- Test the functions
SELECT 'Testing get_vendor_commission_revenue_breakdown_simple...' as test;
SELECT * FROM get_vendor_commission_revenue_breakdown_simple(NULL, '2024-01-01', '2024-12-31') LIMIT 1;

SELECT 'Testing get_vendor_performance_metrics...' as test;
SELECT * FROM get_vendor_performance_metrics(NULL, 30) LIMIT 1;




