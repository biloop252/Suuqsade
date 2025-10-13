-- Remove Finance System Database Components Only
-- This removes only the database tables, functions, and triggers
-- Frontend components and pages need to be removed manually

-- Drop triggers
DROP TRIGGER IF EXISTS order_created_trigger ON orders;
DROP TRIGGER IF EXISTS payment_status_change_trigger ON payments;
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
DROP TRIGGER IF EXISTS calculate_commissions_trigger ON orders;

-- Drop functions
DROP FUNCTION IF EXISTS handle_order_created();
DROP FUNCTION IF EXISTS handle_payment_status_change();
DROP FUNCTION IF EXISTS handle_order_status_change();
DROP FUNCTION IF EXISTS trigger_calculate_commissions();
DROP FUNCTION IF EXISTS calculate_order_commissions(UUID);
DROP FUNCTION IF EXISTS get_vendor_financial_summary(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_admin_financial_summary(DATE, DATE);
DROP FUNCTION IF EXISTS get_realtime_finance_summary();
DROP FUNCTION IF EXISTS get_vendor_performance_metrics(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_daily_sales_breakdown(DATE, DATE);

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS financial_reports CASCADE;
DROP TABLE IF EXISTS admin_revenues CASCADE;
DROP TABLE IF EXISTS vendor_payouts CASCADE;
DROP TABLE IF EXISTS vendor_commissions CASCADE;
DROP TABLE IF EXISTS finance_transactions CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_finance_transactions_type;
DROP INDEX IF EXISTS idx_finance_transactions_status;
DROP INDEX IF EXISTS idx_finance_transactions_created_at;
DROP INDEX IF EXISTS idx_finance_transactions_vendor_id;
DROP INDEX IF EXISTS idx_finance_transactions_order_id;
DROP INDEX IF EXISTS idx_vendor_commissions_vendor_id;
DROP INDEX IF EXISTS idx_vendor_commissions_order_id;
DROP INDEX IF EXISTS idx_vendor_commissions_status;
DROP INDEX IF EXISTS idx_vendor_commissions_created_at;
DROP INDEX IF EXISTS idx_vendor_payouts_vendor_id;
DROP INDEX IF EXISTS idx_vendor_payouts_status;
DROP INDEX IF EXISTS idx_vendor_payouts_period;
DROP INDEX IF EXISTS idx_admin_revenues_type;
DROP INDEX IF EXISTS idx_admin_revenues_status;
DROP INDEX IF EXISTS idx_admin_revenues_created_at;
DROP INDEX IF EXISTS idx_orders_created_at_status;
DROP INDEX IF EXISTS idx_vendor_commissions_order_vendor;
DROP INDEX IF EXISTS idx_finance_transactions_order_type;
DROP INDEX IF EXISTS idx_payments_order_status;

-- Verify removal
SELECT 'Finance database components removed successfully' as status;




