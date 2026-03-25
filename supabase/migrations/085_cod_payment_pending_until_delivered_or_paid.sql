-- COD: keep payments.pending at order placement; mark paid when delivery is delivered
-- or when an admin updates the payment to paid (existing payment trigger).

CREATE OR REPLACE FUNCTION mark_cod_payment_paid_when_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'delivered'
     AND (OLD.status IS DISTINCT FROM 'delivered')
  THEN
    UPDATE payments
    SET status = 'paid', updated_at = NOW()
    WHERE order_id = NEW.order_id
      AND payment_method = 'cash_on_delivery'
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cod_paid_on_delivery ON deliveries;

CREATE TRIGGER trigger_cod_paid_on_delivery
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION mark_cod_payment_paid_when_delivered();

COMMENT ON FUNCTION mark_cod_payment_paid_when_delivered() IS
  'Sets COD payment to paid when delivery status becomes delivered; commissions run via payment trigger';
