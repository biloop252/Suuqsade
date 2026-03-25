-- Commissions were only calculated on payments UPDATE (pending → paid).
-- Inserts with status = 'paid' (e.g. Sifalo webhook) never fired the trigger, so vendor_commissions stayed empty.

-- Idempotent: safe if payment + delivered both try to calculate
CREATE OR REPLACE FUNCTION calculate_order_commissions(order_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  order_item RECORD;
  vendor_commission_rate DECIMAL(5,2);
  commission_amount DECIMAL(10,2);
  admin_amount DECIMAL(10,2);
BEGIN
  IF EXISTS (SELECT 1 FROM vendor_commissions WHERE order_id = order_uuid LIMIT 1) THEN
    RETURN;
  END IF;

  SELECT * INTO order_record FROM orders WHERE id = order_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', order_uuid;
  END IF;

  FOR order_item IN
    SELECT oi.*, p.vendor_id
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid
  LOOP
    IF order_item.vendor_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT vp.commission_rate INTO vendor_commission_rate
    FROM vendor_profiles vp
    WHERE vp.id = order_item.vendor_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendor profile not found for vendor: %', order_item.vendor_id;
    END IF;

    admin_amount := (order_item.total_price * vendor_commission_rate) / 100;
    commission_amount := order_item.total_price - admin_amount;

    INSERT INTO vendor_commissions (
      order_id, vendor_id, order_item_id, product_id,
      commission_rate, order_amount, commission_amount, admin_amount,
      status
    ) VALUES (
      order_uuid, order_item.vendor_id, order_item.id, order_item.product_id,
      vendor_commission_rate, order_item.total_price, commission_amount, admin_amount,
      'pending'
    );

    INSERT INTO finance_transactions (
      transaction_type, order_id, vendor_id, amount, description, status
    ) VALUES (
      'sale_commission', order_uuid, order_item.vendor_id, commission_amount,
      'Vendor commission for order ' || order_record.order_number, 'completed'
    );

    INSERT INTO finance_transactions (
      transaction_type, order_id, vendor_id, amount, description, status
    ) VALUES (
      'admin_revenue', order_uuid, order_item.vendor_id, admin_amount,
      'Admin commission from order ' || order_record.order_number, 'completed'
    );

    INSERT INTO admin_revenues (
      revenue_type, source_id, source_type, amount, description
    ) VALUES (
      'commission', order_item.vendor_id, 'vendor', admin_amount,
      'Admin commission (' || vendor_commission_rate || '%) from vendor for order ' || order_record.order_number
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION handle_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (
    TG_OP = 'INSERT'
    OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'paid')
  ) THEN
    UPDATE finance_transactions
    SET status = 'completed', processed_at = NOW()
    WHERE order_id = NEW.order_id AND transaction_type = 'sale_commission';

    PERFORM calculate_order_commissions(NEW.order_id);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IN ('failed', 'refunded') THEN
    UPDATE finance_transactions
    SET status = CASE
      WHEN NEW.status = 'failed' THEN 'failed'
      WHEN NEW.status = 'refunded' THEN 'cancelled'
    END,
    processed_at = NOW()
    WHERE order_id = NEW.order_id;

    IF NEW.status = 'refunded' THEN
      UPDATE vendor_commissions
      SET status = 'refunded'
      WHERE order_id = NEW.order_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_status_change_trigger ON payments;

CREATE TRIGGER payment_status_change_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_status_change();

COMMENT ON FUNCTION calculate_order_commissions(UUID) IS
  'Creates vendor_commissions and related finance rows; skips if commissions already exist for the order';
