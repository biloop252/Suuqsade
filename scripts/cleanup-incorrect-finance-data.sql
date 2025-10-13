-- Cleanup Incorrect Finance Data
-- This script removes the incorrectly calculated finance data before the commission fix
-- Run this after applying the corrected commission calculation logic

-- 1. Delete incorrect finance transactions
DELETE FROM finance_transactions 
WHERE transaction_type IN ('sale_commission', 'admin_revenue')
  AND created_at < NOW() - INTERVAL '1 hour'; -- Adjust time as needed

-- 2. Delete incorrect vendor commissions
DELETE FROM vendor_commissions 
WHERE created_at < NOW() - INTERVAL '1 hour'; -- Adjust time as needed

-- 3. Delete incorrect admin revenues
DELETE FROM admin_revenues 
WHERE revenue_type = 'commission'
  AND created_at < NOW() - INTERVAL '1 hour'; -- Adjust time as needed

-- 4. Delete any test data created during testing
DELETE FROM finance_transactions 
WHERE description LIKE '%TEST-%' OR description LIKE '%Test%';

DELETE FROM vendor_commissions 
WHERE order_id IN (
  SELECT id FROM orders WHERE order_number LIKE 'TEST-%'
);

DELETE FROM admin_revenues 
WHERE description LIKE '%TEST-%' OR description LIKE '%Test%';

-- 5. Clean up test orders and related data
DELETE FROM payments 
WHERE order_id IN (
  SELECT id FROM orders WHERE order_number LIKE 'TEST-%'
);

DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders WHERE order_number LIKE 'TEST-%'
);

DELETE FROM orders 
WHERE order_number LIKE 'TEST-%';

-- 6. Reset any auto-increment sequences if needed (PostgreSQL)
-- SELECT setval('finance_transactions_id_seq', (SELECT MAX(id) FROM finance_transactions));
-- SELECT setval('vendor_commissions_id_seq', (SELECT MAX(id) FROM vendor_commissions));
-- SELECT setval('admin_revenues_id_seq', (SELECT MAX(id) FROM admin_revenues));

-- 7. Verify cleanup (run these to check)
-- SELECT COUNT(*) as remaining_finance_transactions FROM finance_transactions;
-- SELECT COUNT(*) as remaining_vendor_commissions FROM vendor_commissions;
-- SELECT COUNT(*) as remaining_admin_revenues FROM admin_revenues WHERE revenue_type = 'commission';

-- 8. Optional: If you want to clean ALL finance data (use with caution)
-- DELETE FROM finance_transactions;
-- DELETE FROM vendor_commissions;
-- DELETE FROM admin_revenues WHERE revenue_type = 'commission';
-- DELETE FROM vendor_payouts;
-- DELETE FROM financial_reports;



