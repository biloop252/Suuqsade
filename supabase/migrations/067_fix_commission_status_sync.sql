-- Fix Commission Status Sync
-- This migration ensures that commission statuses are properly synchronized when payouts are completed

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS payout_status_change_trigger ON vendor_payouts;
DROP FUNCTION IF EXISTS handle_payout_status_change();
DROP FUNCTION IF EXISTS fix_orphaned_commissions();

-- Create a function to automatically update commission statuses when payout is completed
CREATE OR REPLACE FUNCTION handle_payout_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count INTEGER;
BEGIN
  -- If payout is being marked as completed, ensure all related commissions are marked as paid
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    RAISE NOTICE 'Payout % marked as completed, updating commission statuses for vendor %', NEW.id, NEW.vendor_id;
    
    -- Update any commissions for this vendor that might still be pending
    UPDATE vendor_commissions 
    SET 
      status = 'paid',
      paid_at = NOW(),
      payout_transaction_id = NEW.transaction_id
    WHERE vendor_id = NEW.vendor_id 
      AND status = 'pending'
      AND NEW.transaction_id IS NOT NULL;
    
    -- Log how many commissions were updated
    GET DIAGNOSTICS result_count = ROW_COUNT;
    RAISE NOTICE 'Updated % commissions to paid status for vendor %', result_count, NEW.vendor_id;
    
    -- If no transaction_id, just update status without transaction reference
    IF NEW.transaction_id IS NULL THEN
      UPDATE vendor_commissions 
      SET 
        status = 'paid',
        paid_at = NOW()
      WHERE vendor_id = NEW.vendor_id 
        AND status = 'pending';
      
      GET DIAGNOSTICS result_count = ROW_COUNT;
      RAISE NOTICE 'Updated % commissions to paid status (no transaction_id) for vendor %', result_count, NEW.vendor_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER payout_status_change_trigger
  AFTER UPDATE ON vendor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION handle_payout_status_change();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_payout_status_change() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION handle_payout_status_change() IS 'Automatically updates commission statuses to paid when payout is marked as completed';

-- Create a function to manually fix orphaned commissions (for admin use)
CREATE OR REPLACE FUNCTION fix_orphaned_commissions()
RETURNS TABLE (
  vendor_id UUID,
  fixed_count INTEGER,
  total_amount DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_record RECORD;
  commission_count INTEGER;
  commission_total DECIMAL(12,2);
BEGIN
  -- Find vendors with completed payouts but pending commissions
  FOR vendor_record IN 
    SELECT DISTINCT vp.vendor_id
    FROM vendor_payouts vp
    WHERE vp.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM vendor_commissions vc 
        WHERE vc.vendor_id = vp.vendor_id 
          AND vc.status = 'pending'
      )
  LOOP
    -- Update pending commissions for this vendor
    UPDATE vendor_commissions 
    SET 
      status = 'paid',
      paid_at = NOW()
    WHERE vendor_id = vendor_record.vendor_id 
      AND status = 'pending';
    
    -- Get count and total of fixed commissions
    GET DIAGNOSTICS commission_count = ROW_COUNT;
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO commission_total
    FROM vendor_commissions 
    WHERE vendor_id = vendor_record.vendor_id 
      AND status = 'paid'
      AND paid_at >= NOW() - INTERVAL '1 minute'; -- Only count recently updated ones
    
    -- Return the result
    vendor_id := vendor_record.vendor_id;
    fixed_count := commission_count;
    total_amount := commission_total;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION fix_orphaned_commissions() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION fix_orphaned_commissions() IS 'Manually fixes orphaned pending commissions for vendors with completed payouts';
