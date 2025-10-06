-- Order and Delivery Status Synchronization
-- This migration creates triggers and functions to sync status between orders and deliveries

-- Create function to map delivery status to order status
CREATE OR REPLACE FUNCTION map_delivery_to_order_status(delivery_status delivery_status)
RETURNS order_status AS $$
BEGIN
  CASE delivery_status
    WHEN 'pending' THEN RETURN 'processing';
    WHEN 'in_transit' THEN RETURN 'shipped';
    WHEN 'delivered' THEN RETURN 'delivered';
    WHEN 'failed' THEN RETURN 'cancelled';
    ELSE RETURN 'processing';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to map order status to delivery status
CREATE OR REPLACE FUNCTION map_order_to_delivery_status(order_status order_status)
RETURNS delivery_status AS $$
BEGIN
  CASE order_status
    WHEN 'pending' THEN RETURN 'pending';
    WHEN 'confirmed' THEN RETURN 'pending';
    WHEN 'processing' THEN RETURN 'pending';
    WHEN 'shipped' THEN RETURN 'in_transit';
    WHEN 'delivered' THEN RETURN 'delivered';
    WHEN 'cancelled' THEN RETURN 'failed';
    WHEN 'returned' THEN RETURN 'failed';
    ELSE RETURN 'pending';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync order status when delivery status changes
CREATE OR REPLACE FUNCTION sync_order_status_from_delivery()
RETURNS TRIGGER AS $$
DECLARE
  new_order_status order_status;
BEGIN
  -- Only proceed if delivery status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map delivery status to order status
  new_order_status := map_delivery_to_order_status(NEW.status);

  -- Update the order status
  UPDATE orders 
  SET 
    status = new_order_status,
    updated_at = NOW()
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync delivery status when order status changes
CREATE OR REPLACE FUNCTION sync_delivery_status_from_order()
RETURNS TRIGGER AS $$
DECLARE
  new_delivery_status delivery_status;
BEGIN
  -- Only proceed if order status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map order status to delivery status
  new_delivery_status := map_order_to_delivery_status(NEW.status);

  -- Update the delivery status if delivery exists
  UPDATE deliveries 
  SET 
    status = new_delivery_status,
    updated_at = NOW()
  WHERE order_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync order status when delivery status changes
CREATE TRIGGER trigger_sync_order_status_from_delivery
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_from_delivery();

-- Create trigger to sync delivery status when order status changes
CREATE TRIGGER trigger_sync_delivery_status_from_order
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_delivery_status_from_order();

-- Create function to get status sync information
CREATE OR REPLACE FUNCTION get_order_delivery_sync_info(order_id_param UUID)
RETURNS TABLE (
  order_id UUID,
  order_status order_status,
  delivery_id UUID,
  delivery_status delivery_status,
  is_synced BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.status as order_status,
    d.id as delivery_id,
    d.status as delivery_status,
    CASE 
      WHEN d.status IS NULL THEN true
      WHEN map_order_to_delivery_status(o.status) = d.status THEN true
      ELSE false
    END as is_synced
  FROM orders o
  LEFT JOIN deliveries d ON o.id = d.order_id
  WHERE o.id = order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to manually sync order and delivery status
CREATE OR REPLACE FUNCTION sync_order_delivery_status(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  order_record RECORD;
  delivery_record RECORD;
  expected_delivery_status delivery_status;
BEGIN
  -- Get order information
  SELECT * INTO order_record FROM orders WHERE id = order_id_param;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get delivery information
  SELECT * INTO delivery_record FROM deliveries WHERE order_id = order_id_param LIMIT 1;
  
  -- If delivery exists, sync based on order status
  IF FOUND THEN
    expected_delivery_status := map_order_to_delivery_status(order_record.status);
    
    -- Update delivery status if it doesn't match
    IF delivery_record.status != expected_delivery_status THEN
      UPDATE deliveries 
      SET 
        status = expected_delivery_status,
        updated_at = NOW()
      WHERE id = delivery_record.id;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to manually sync delivery and order status
CREATE OR REPLACE FUNCTION sync_delivery_order_status(delivery_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  delivery_record RECORD;
  order_record RECORD;
  expected_order_status order_status;
BEGIN
  -- Get delivery information
  SELECT * INTO delivery_record FROM deliveries WHERE id = delivery_id_param;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get order information
  SELECT * INTO order_record FROM orders WHERE id = delivery_record.order_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Map delivery status to order status
  expected_order_status := map_delivery_to_order_status(delivery_record.status);
  
  -- Update order status if it doesn't match
  IF order_record.status != expected_order_status THEN
    UPDATE orders 
    SET 
      status = expected_order_status,
      updated_at = NOW()
    WHERE id = order_record.id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION map_delivery_to_order_status(delivery_status) IS 'Maps delivery status to corresponding order status';
COMMENT ON FUNCTION map_order_to_delivery_status(order_status) IS 'Maps order status to corresponding delivery status';
COMMENT ON FUNCTION sync_order_status_from_delivery() IS 'Trigger function to sync order status when delivery status changes';
COMMENT ON FUNCTION sync_delivery_status_from_order() IS 'Trigger function to sync delivery status when order status changes';
COMMENT ON FUNCTION get_order_delivery_sync_info(UUID) IS 'Returns sync status information for an order and its delivery';
COMMENT ON FUNCTION sync_order_delivery_status(UUID) IS 'Manually syncs order and delivery status for a specific order';
COMMENT ON FUNCTION sync_delivery_order_status(UUID) IS 'Manually syncs delivery and order status for a specific delivery';
