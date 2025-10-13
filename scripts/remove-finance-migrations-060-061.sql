-- Remove Finance System Migrations 060 and 061
-- This script completely removes all finance system components
-- WARNING: This will delete ALL finance data and functionality

-- 1. Drop all triggers created by the finance system
DROP TRIGGER IF EXISTS order_created_trigger ON orders;
DROP TRIGGER IF EXISTS payment_status_change_trigger ON payments;
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
DROP TRIGGER IF EXISTS calculate_commissions_trigger ON orders;

-- 2. Drop all functions created by the finance system
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

-- 3. Drop all tables created by the finance system (in reverse dependency order)
DROP TABLE IF EXISTS financial_reports CASCADE;
DROP TABLE IF EXISTS admin_revenues CASCADE;
DROP TABLE IF EXISTS vendor_payouts CASCADE;
DROP TABLE IF EXISTS vendor_commissions CASCADE;
DROP TABLE IF EXISTS finance_transactions CASCADE;

-- 4. Drop all indexes created by the finance system
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

-- 5. Remove any RLS policies that might have been created (if any exist)
-- Note: These are automatically dropped when tables are dropped, but included for completeness
-- DROP POLICY IF EXISTS "Finance transactions are viewable by admins" ON finance_transactions;
-- DROP POLICY IF EXISTS "Finance transactions are insertable by admins" ON finance_transactions;
-- DROP POLICY IF EXISTS "Vendor commissions are viewable by admins and vendors" ON vendor_commissions;
-- DROP POLICY IF EXISTS "Vendor commissions are insertable by system" ON vendor_commissions;
-- DROP POLICY IF EXISTS "Vendor payouts are viewable by admins and vendors" ON vendor_payouts;
-- DROP POLICY IF EXISTS "Vendor payouts are manageable by admins" ON vendor_payouts;
-- DROP POLICY IF EXISTS "Admin revenues are viewable by admins only" ON admin_revenues;
-- DROP POLICY IF EXISTS "Admin revenues are manageable by admins" ON admin_revenues;
-- DROP POLICY IF EXISTS "Financial reports are viewable by admins only" ON financial_reports;
-- DROP POLICY IF EXISTS "Financial reports are manageable by admins" ON financial_reports;

-- 6. Clean up any sequences that might have been created
DROP SEQUENCE IF EXISTS finance_transactions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS vendor_commissions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS vendor_payouts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS admin_revenues_id_seq CASCADE;
DROP SEQUENCE IF EXISTS financial_reports_id_seq CASCADE;

-- 7. Verify removal (these should return 0 or error if tables don't exist)
SELECT 'Finance tables removed successfully' as status;

-- 8. Optional: Remove the migration files from your migrations folder
-- You'll need to manually delete these files:
-- - supabase/migrations/060_finance_management_system.sql
-- - supabase/migrations/061_finance_integration_triggers.sql

-- 9. Optional: Clean up any TypeScript types related to finance system
-- You'll need to manually remove finance-related interfaces from types/database.ts:
-- - FinanceTransaction
-- - VendorCommission  
-- - VendorPayout
-- - AdminRevenue
-- - FinancialReport
-- - And their extended interfaces

-- 10. Optional: Remove finance-related components
-- You'll need to manually delete these files:
-- - components/admin/FinanceManagement.tsx
-- - components/admin/FinanceDashboard.tsx
-- - components/admin/RealTimeFinanceMonitor.tsx
-- - components/admin/VendorPayoutManagement.tsx
-- - components/admin/RevenueManagement.tsx
-- - components/admin/FinanceReports.tsx
-- - components/admin/FinanceSubNavigation.tsx

-- 11. Optional: Remove finance-related pages
-- You'll need to manually delete these directories:
-- - app/admin/finance/
-- - app/admin/finance/overview/
-- - app/admin/finance/payouts/
-- - app/admin/finance/revenues/
-- - app/admin/finance/reports/

-- 12. Optional: Remove finance tab from admin navigation
-- You'll need to manually remove the Finance tab from:
-- - components/admin/AdminLayoutWrapper.tsx (remove from navigation array)



