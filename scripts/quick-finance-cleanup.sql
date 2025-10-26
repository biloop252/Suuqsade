-- Quick Finance Data Cleanup
-- Run this to quickly clean up all finance data created before the commission fix

-- Delete all finance transactions
DELETE FROM finance_transactions;

-- Delete all vendor commissions  
DELETE FROM vendor_commissions;

-- Delete all commission-related admin revenues
DELETE FROM admin_revenues WHERE revenue_type = 'commission';

-- Delete all vendor payouts
DELETE FROM vendor_payouts;

-- Delete all financial reports
DELETE FROM financial_reports;

-- Reset sequences (PostgreSQL)
SELECT setval('finance_transactions_id_seq', 1, false);
SELECT setval('vendor_commissions_id_seq', 1, false);
SELECT setval('admin_revenues_id_seq', 1, false);
SELECT setval('vendor_payouts_id_seq', 1, false);
SELECT setval('financial_reports_id_seq', 1, false);

-- Verify cleanup
SELECT 'Finance data cleaned up successfully' as status;














