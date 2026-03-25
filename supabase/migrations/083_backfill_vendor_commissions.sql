-- One-time backfill: orders with paid payment but no vendor_commissions (e.g. pre-082 inserts).

CREATE OR REPLACE FUNCTION backfill_missing_vendor_commissions()
RETURNS TABLE (
  orders_attempted BIGINT,
  commissions_created BIGINT,
  no_vendor_lines BIGINT,
  failed BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_attempted BIGINT := 0;
  v_created BIGINT := 0;
  v_no_vendor BIGINT := 0;
  v_failed BIGINT := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT p.order_id
    FROM payments p
    WHERE p.status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM vendor_commissions vc WHERE vc.order_id = p.order_id
      )
  LOOP
    v_attempted := v_attempted + 1;

    BEGIN
      PERFORM calculate_order_commissions(r.order_id);

      IF EXISTS (SELECT 1 FROM vendor_commissions WHERE order_id = r.order_id LIMIT 1) THEN
        v_created := v_created + 1;
      ELSE
        v_no_vendor := v_no_vendor + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      RAISE WARNING 'backfill_missing_vendor_commissions: order % failed: %', r.order_id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT v_attempted, v_created, v_no_vendor, v_failed;
END;
$$;

GRANT EXECUTE ON FUNCTION backfill_missing_vendor_commissions() TO service_role;
GRANT EXECUTE ON FUNCTION backfill_missing_vendor_commissions() TO authenticated;

COMMENT ON FUNCTION backfill_missing_vendor_commissions() IS
  'Creates vendor_commissions for paid orders missing them; safe to run multiple times';

-- Run once when migration applies
SELECT * FROM backfill_missing_vendor_commissions();
