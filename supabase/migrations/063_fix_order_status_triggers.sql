-- Fix Order Status Triggers
-- This migration fixes conflicting triggers that prevent order status updates to 'delivered'

-- Drop all existing conflicting triggers on orders table
DROP TRIGGER IF EXISTS trigger_sync_delivery_status_from_order ON orders;
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
DROP TRIGGER IF EXISTS calculate_commissions_trigger ON orders;

-- Create a unified trigger function that handles all order status changes
CREATE OR REPLACE FUNCTION handle_order_status_change_unified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_delivery_status delivery_status;
BEGIN
  -- Log the status change for debugging
  RAISE NOTICE 'Order % status changed from % to %', NEW.id, OLD.status, NEW.status;
  
  -- Only proceed if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Handle delivery status sync (only if delivery exists)
  IF EXISTS (SELECT 1 FROM deliveries WHERE order_id = NEW.id) THEN
    -- Map order status to delivery status
    new_delivery_status := map_order_to_delivery_status(NEW.status);
    
    -- Update delivery status if it doesn't match
    UPDATE deliveries 
    SET 
      status = new_delivery_status,
      updated_at = NOW()
    WHERE order_id = NEW.id;
    
    RAISE NOTICE 'Updated delivery status to % for order %', new_delivery_status, NEW.id;
  END IF;

  -- Handle commission calculation when order is delivered
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

-- Create the unified trigger
CREATE TRIGGER order_status_change_unified_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_change_unified();

-- Add function to test order status updates
CREATE OR REPLACE FUNCTION test_order_status_update(order_uuid UUID, new_status order_status)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text TEXT := '';
  old_status order_status;
BEGIN
  -- Get current status
  SELECT status INTO old_status FROM orders WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN 'Order not found: ' || order_uuid;
  END IF;
  
  result_text := 'Testing status change from ' || old_status || ' to ' || new_status || E'\n';
  
  -- Update the order status
  UPDATE orders 
  SET status = new_status, updated_at = NOW()
  WHERE id = order_uuid;
  
  result_text := result_text || 'Status update completed successfully';
  
  RETURN result_text;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION test_order_status_update(UUID, order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_order_status_change_unified() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION handle_order_status_change_unified() IS 'Unified trigger function that handles delivery sync and commission calculation for order status changes';
COMMENT ON FUNCTION test_order_status_update(UUID, order_status) IS 'Test function to manually update order status and verify trigger functionality';







