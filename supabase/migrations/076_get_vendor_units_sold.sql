-- Function to get total units sold for a vendor (sum of order_items.quantity for vendor's products)
CREATE OR REPLACE FUNCTION public.get_vendor_units_sold(vendor_uuid UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total BIGINT;
BEGIN
  SELECT COALESCE(SUM(oi.quantity), 0)::bigint
  INTO total
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE p.vendor_id = vendor_uuid;

  RETURN total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vendor_units_sold(UUID) TO anon, authenticated, service_role;


