-- Add sample admin revenue data to populate the finance revenues list
-- This script ensures there's data to display in the admin revenues tab

-- First, check if there's existing data
SELECT 'Current admin revenues count:' as info, COUNT(*) as count FROM admin_revenues;

-- Add sample admin revenue records if table is empty or has few records
INSERT INTO admin_revenues (revenue_type, source_type, amount, description, status) VALUES
('commission', 'vendor', 150.00, 'Admin commission from vendor sales - Order #12345', 'confirmed'),
('subscription', 'vendor', 99.00, 'Monthly subscription fee - Premium vendor plan', 'confirmed'),
('advertising', 'advertiser', 500.00, 'Banner advertising revenue - Q1 2024 campaign', 'confirmed'),
('listing_fee', 'vendor', 25.00, 'Product listing fee - Electronics category', 'confirmed'),
('commission', 'vendor', 75.50, 'Admin commission from order #12346', 'confirmed'),
('premium_features', 'vendor', 200.00, 'Premium vendor features subscription - Analytics Pro', 'confirmed'),
('commission', 'vendor', 120.25, 'Admin commission from order #12347', 'confirmed'),
('advertising', 'advertiser', 300.00, 'Sponsored product placement revenue', 'confirmed'),
('listing_fee', 'vendor', 15.00, 'Product listing fee - Fashion category', 'confirmed'),
('subscription', 'vendor', 199.00, 'Annual subscription fee - Enterprise plan', 'confirmed')
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 'After insertion - admin revenues count:' as info, COUNT(*) as count FROM admin_revenues;

-- Show sample records
SELECT 
  revenue_type,
  source_type,
  amount,
  description,
  status,
  created_at
FROM admin_revenues 
ORDER BY created_at DESC 
LIMIT 10;

-- Test the admin financial summary function
SELECT 'Testing get_admin_financial_summary function:' as info;
SELECT * FROM get_admin_financial_summary('2024-01-01', '2024-12-31');

