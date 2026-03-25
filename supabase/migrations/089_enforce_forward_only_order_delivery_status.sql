-- Enforce forward-only status transitions for orders and deliveries.
-- Prevents downgrades (e.g. shipped -> processing, in_transit -> pending).

CREATE OR REPLACE FUNCTION order_status_rank(s order_status)
RETURNS INT AS $$
BEGIN
  CASE s
    WHEN 'pending' THEN RETURN 10;
    WHEN 'confirmed' THEN RETURN 20;
    WHEN 'processing' THEN RETURN 30;
    WHEN 'shipped' THEN RETURN 40;
    WHEN 'delivered' THEN RETURN 50;
    WHEN 'cancelled' THEN RETURN 90;
    WHEN 'returned' THEN RETURN 100;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION delivery_status_rank(s delivery_status)
RETURNS INT AS $$
BEGIN
  CASE s
    WHEN 'pending' THEN RETURN 10;
    WHEN 'in_transit' THEN RETURN 20;
    WHEN 'delivered' THEN RETURN 30;
    WHEN 'failed' THEN RETURN 90;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION enforce_forward_only_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Disallow moving away from terminal states
  IF OLD.status IN ('cancelled', 'returned') THEN
    RAISE EXCEPTION 'Order status is terminal (%), cannot change', OLD.status;
  END IF;

  -- Allow cancellation from any non-terminal state
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Allow returned only from delivered (or already returned which is handled above)
  IF NEW.status = 'returned' AND OLD.status <> 'delivered' THEN
    RAISE EXCEPTION 'Order can only be returned after delivered';
  END IF;

  -- Forward-only progression for the main flow
  IF order_status_rank(NEW.status) < order_status_rank(OLD.status) THEN
    RAISE EXCEPTION 'Order status cannot move backwards from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_forward_only_delivery_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Disallow moving away from terminal states
  IF OLD.status IN ('delivered', 'failed') THEN
    RAISE EXCEPTION 'Delivery status is terminal (%), cannot change', OLD.status;
  END IF;

  -- Allow marking failed from any non-terminal state
  IF NEW.status = 'failed' THEN
    RETURN NEW;
  END IF;

  -- Forward-only for main flow
  IF delivery_status_rank(NEW.status) < delivery_status_rank(OLD.status) THEN
    RAISE EXCEPTION 'Delivery status cannot move backwards from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_forward_only_order_status ON orders;
CREATE TRIGGER trigger_enforce_forward_only_order_status
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION enforce_forward_only_order_status();

DROP TRIGGER IF EXISTS trigger_enforce_forward_only_delivery_status ON deliveries;
CREATE TRIGGER trigger_enforce_forward_only_delivery_status
  BEFORE UPDATE OF status ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION enforce_forward_only_delivery_status();

-- Patch sync functions to never downgrade via mapping.
CREATE OR REPLACE FUNCTION sync_order_status_from_delivery()
RETURNS TRIGGER AS $$
DECLARE
  new_order_status order_status;
  current_order_status order_status;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  new_order_status := map_delivery_to_order_status(NEW.status);

  SELECT status INTO current_order_status FROM orders WHERE id = NEW.order_id;

  -- Only update if it moves forward (or cancels)
  IF current_order_status IS NOT NULL AND new_order_status IS NOT NULL THEN
    IF new_order_status = 'cancelled' OR order_status_rank(new_order_status) >= order_status_rank(current_order_status) THEN
      UPDATE orders
      SET status = new_order_status, updated_at = NOW()
      WHERE id = NEW.order_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_delivery_status_from_order()
RETURNS TRIGGER AS $$
DECLARE
  new_delivery_status delivery_status;
  current_delivery_status delivery_status;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  new_delivery_status := map_order_to_delivery_status(NEW.status);

  SELECT status INTO current_delivery_status FROM deliveries WHERE order_id = NEW.id LIMIT 1;

  IF current_delivery_status IS NOT NULL AND new_delivery_status IS NOT NULL THEN
    -- Only update if it moves forward (or fails)
    IF new_delivery_status = 'failed' OR delivery_status_rank(new_delivery_status) >= delivery_status_rank(current_delivery_status) THEN
      UPDATE deliveries
      SET status = new_delivery_status, updated_at = NOW()
      WHERE order_id = NEW.id;
    END IF;
  ELSE
    -- If no delivery exists, nothing to sync
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Patch manual sync helpers to never downgrade.
CREATE OR REPLACE FUNCTION sync_order_delivery_status(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  order_record RECORD;
  delivery_record RECORD;
  expected_delivery_status delivery_status;
BEGIN
  SELECT * INTO order_record FROM orders WHERE id = order_id_param;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT * INTO delivery_record FROM deliveries WHERE order_id = order_id_param LIMIT 1;

  IF FOUND THEN
    expected_delivery_status := map_order_to_delivery_status(order_record.status);

    IF delivery_record.status != expected_delivery_status THEN
      IF expected_delivery_status = 'failed'
        OR delivery_status_rank(expected_delivery_status) >= delivery_status_rank(delivery_record.status) THEN
        UPDATE deliveries
        SET status = expected_delivery_status, updated_at = NOW()
        WHERE id = delivery_record.id;
      END IF;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_delivery_order_status(delivery_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  delivery_record RECORD;
  order_record RECORD;
  expected_order_status order_status;
BEGIN
  SELECT * INTO delivery_record FROM deliveries WHERE id = delivery_id_param;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT * INTO order_record FROM orders WHERE id = delivery_record.order_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  expected_order_status := map_delivery_to_order_status(delivery_record.status);

  IF order_record.status != expected_order_status THEN
    IF expected_order_status = 'cancelled'
      OR order_status_rank(expected_order_status) >= order_status_rank(order_record.status) THEN
      UPDATE orders
      SET status = expected_order_status, updated_at = NOW()
      WHERE id = order_record.id;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

