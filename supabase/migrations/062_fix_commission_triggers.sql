-- Fix Commission Triggers
-- This migration fixes the commission calculation triggers to ensure they work properly

-- Drop any existing conflicting triggers
DROP TRIGGER IF EXISTS calculate_commissions_trigger ON orders;
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;

-- Create a single, comprehensive trigger function for order status changes
CREATE OR REPLACE FUNCTION handle_order_status_change_comprehensive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the status change for debugging
  RAISE NOTICE 'Order % status changed from % to %', NEW.id, OLD.status, NEW.status;
  
  -- If order is marked as delivered, calculate commissions
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    RAISE NOTICE 'Calculating commissions for delivered order %', NEW.id;
    
    -- Check if commissions already exist for this order
    IF NOT EXISTS (SELECT 1 FROM vendor_commissions WHERE order_id = NEW.id) THEN
      -- Calculate commissions if they don't exist
      PERFORM calculate_order_commissions(NEW.id);
      RAISE NOTICE 'Commissions calculated for order %', NEW.id;
    ELSE
      RAISE NOTICE 'Commissions already exist for order %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_change_comprehensive();

-- Add a function to manually trigger commission calculation for testing
CREATE OR REPLACE FUNCTION manual_commission_calculation(order_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text TEXT := '';
  commission_count INTEGER := 0;
BEGIN
  -- Check if order exists
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = order_uuid) THEN
    RETURN 'Order not found: ' || order_uuid;
  END IF;
  
  -- Check if order has vendor products
  IF NOT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid AND p.vendor_id IS NOT NULL
  ) THEN
    RETURN 'Order has no vendor products';
  END IF;
  
  -- Calculate commissions
  PERFORM calculate_order_commissions(order_uuid);
  
  -- Count created commissions
  SELECT COUNT(*) INTO commission_count
  FROM vendor_commissions
  WHERE order_id = order_uuid;
  
  result_text := 'Commissions calculated successfully. Created ' || commission_count || ' commission records.';
  
  RETURN result_text;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION manual_commission_calculation(UUID) TO authenticated;

-- Add some debugging information
COMMENT ON FUNCTION handle_order_status_change_comprehensive() IS 'Comprehensive order status change handler that calculates commissions when order is delivered';
COMMENT ON FUNCTION manual_commission_calculation(UUID) IS 'Manual function to trigger commission calculation for testing purposes';





