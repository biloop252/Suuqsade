-- Selective Finance Data Cleanup
-- Use this script to selectively clean up finance data
-- Modify the WHERE conditions based on your specific needs

-- 1. View current finance data before cleanup
SELECT 'Finance Transactions' as table_name, COUNT(*) as count FROM finance_transactions
UNION ALL
SELECT 'Vendor Commissions' as table_name, COUNT(*) as count FROM vendor_commissions
UNION ALL
SELECT 'Admin Revenues' as table_name, COUNT(*) as count FROM admin_revenues WHERE revenue_type = 'commission'
UNION ALL
SELECT 'Vendor Payouts' as table_name, COUNT(*) as count FROM vendor_payouts;

-- 2. View recent finance transactions (last 24 hours)
SELECT 
  ft.id,
  ft.transaction_type,
  ft.amount,
  ft.description,
  ft.created_at,
  o.order_number
FROM finance_transactions ft
LEFT JOIN orders o ON ft.order_id = o.id
WHERE ft.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY ft.created_at DESC;

-- 3. View recent vendor commissions
SELECT 
  vc.id,
  vc.order_id,
  vc.vendor_id,
  vc.commission_rate,
  vc.order_amount,
  vc.commission_amount,
  vc.admin_amount,
  vc.status,
  vc.created_at,
  o.order_number
FROM vendor_commissions vc
LEFT JOIN orders o ON vc.order_id = o.id
WHERE vc.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY vc.created_at DESC;

-- 4. Clean up by specific date range (modify dates as needed)
-- DELETE FROM finance_transactions 
-- WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';

-- DELETE FROM vendor_commissions 
-- WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';

-- DELETE FROM admin_revenues 
-- WHERE revenue_type = 'commission' 
--   AND created_at BETWEEN '2024-01-01' AND '2024-01-31';

-- 5. Clean up by order numbers (if you know specific incorrect orders)
-- DELETE FROM finance_transactions 
-- WHERE order_id IN (
--   SELECT id FROM orders WHERE order_number IN ('ORDER-123', 'ORDER-456')
-- );

-- DELETE FROM vendor_commissions 
-- WHERE order_id IN (
--   SELECT id FROM orders WHERE order_number IN ('ORDER-123', 'ORDER-456')
-- );

-- DELETE FROM admin_revenues 
-- WHERE revenue_type = 'commission' 
--   AND description LIKE '%ORDER-123%' OR description LIKE '%ORDER-456%';

-- 6. Clean up all finance data for specific vendors (if needed)
-- DELETE FROM finance_transactions 
-- WHERE vendor_id = 'vendor-uuid-here';

-- DELETE FROM vendor_commissions 
-- WHERE vendor_id = 'vendor-uuid-here';

-- DELETE FROM admin_revenues 
-- WHERE revenue_type = 'commission' 
--   AND source_id = 'vendor-uuid-here';

-- 7. Verify cleanup results
-- SELECT 'After Cleanup - Finance Transactions' as table_name, COUNT(*) as count FROM finance_transactions
-- UNION ALL
-- SELECT 'After Cleanup - Vendor Commissions' as table_name, COUNT(*) as count FROM vendor_commissions
-- UNION ALL
-- SELECT 'After Cleanup - Admin Revenues' as table_name, COUNT(*) as count FROM admin_revenues WHERE revenue_type = 'commission';



