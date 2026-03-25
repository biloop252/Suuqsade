-- Replace KPI logic when an older payment-based get_finance_dashboard_metrics was already applied.
CREATE OR REPLACE FUNCTION get_finance_dashboard_metrics(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_sales DECIMAL(12,2),
  admin_commission DECIMAL(12,2),
  pending_payout DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(vc.order_amount), 0)::DECIMAL(12,2) AS total_sales,
    COALESCE(SUM(vc.admin_amount), 0)::DECIMAL(12,2) AS admin_commission,
    COALESCE(SUM(vc.commission_amount), 0)::DECIMAL(12,2) AS pending_payout
  FROM vendor_commissions vc
  WHERE vc.created_at::date BETWEEN start_date AND end_date;
END;
$$;

GRANT EXECUTE ON FUNCTION get_finance_dashboard_metrics(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_finance_dashboard_metrics(DATE, DATE) TO service_role;

COMMENT ON FUNCTION get_finance_dashboard_metrics(DATE, DATE) IS
  'total_sales=SUM(order_amount); admin_commission=SUM(admin_amount); pending_payout=SUM(commission_amount) from vendor_commissions in range';
