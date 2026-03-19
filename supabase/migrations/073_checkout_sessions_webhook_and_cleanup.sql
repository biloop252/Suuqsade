-- Add order_id for idempotent session finalization + add cleanup job for expired sessions.

ALTER TABLE checkout_sessions
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_checkout_sessions_order_id ON checkout_sessions(order_id) WHERE order_id IS NOT NULL;

-- Cleanup function: delete old sessions that never resulted in an order.
CREATE OR REPLACE FUNCTION cleanup_expired_checkout_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM checkout_sessions
  WHERE order_id IS NULL
    AND expires_at < NOW()
    AND status IN ('created', 'pending', 'failed');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Best-effort schedule using pg_cron if available in the database.
DO $$
BEGIN
  -- Try enabling pg_cron (may fail depending on environment); ignore errors.
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    -- ignore
  END;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Run every hour: minute 7 to spread load
    PERFORM cron.schedule(
      'cleanup_expired_checkout_sessions_hourly',
      '7 * * * *',
      'SELECT cleanup_expired_checkout_sessions();'
    );
  END IF;
END $$;

