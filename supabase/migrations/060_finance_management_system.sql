-- Finance Management System Migration
-- This migration creates tables and functions for comprehensive financial tracking

-- Create finance_transactions table for all financial activities
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'sale_commission', 'vendor_payout', 'admin_revenue', 'subscription_fee', 
    'advertising_revenue', 'refund', 'chargeback', 'penalty', 'bonus'
  )),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id VARCHAR(255), -- External reference (payment gateway, bank transfer, etc.)
  metadata JSONB, -- Additional transaction data
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_commissions table for detailed commission tracking
CREATE TABLE IF NOT EXISTS vendor_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  commission_rate DECIMAL(5,2) NOT NULL, -- Commission percentage at time of sale
  order_amount DECIMAL(10,2) NOT NULL, -- Original order item amount
  commission_amount DECIMAL(10,2) NOT NULL, -- Calculated commission
  admin_amount DECIMAL(10,2) NOT NULL, -- Admin's share (order_amount - commission_amount)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_payouts table for payout management
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_commission DECIMAL(12,2) NOT NULL,
  total_orders INTEGER NOT NULL,
  payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe', 'check')),
  payout_details JSONB, -- Bank details, PayPal email, etc.
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_revenues table for tracking admin revenue streams
CREATE TABLE IF NOT EXISTS admin_revenues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  revenue_type VARCHAR(50) NOT NULL CHECK (revenue_type IN (
    'commission', 'subscription', 'advertising', 'listing_fee', 'premium_features', 'other'
  )),
  source_id UUID, -- Reference to source (vendor_id, user_id, etc.)
  source_type VARCHAR(50), -- 'vendor', 'user', 'advertiser', etc.
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  period_start DATE,
  period_end DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financial_reports table for storing generated reports
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'daily_sales', 'monthly_commissions', 'vendor_payouts', 'admin_revenue', 'tax_summary'
  )),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  data JSONB NOT NULL, -- Report data in JSON format
  file_url TEXT, -- Link to generated PDF/Excel file
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON finance_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON finance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_created_at ON finance_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_vendor_id ON finance_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_order_id ON finance_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_vendor_commissions_vendor_id ON vendor_commissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_order_id ON vendor_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_status ON vendor_commissions(status);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_created_at ON vendor_commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_period ON vendor_payouts(payout_period_start, payout_period_end);

CREATE INDEX IF NOT EXISTS idx_admin_revenues_type ON admin_revenues(revenue_type);
CREATE INDEX IF NOT EXISTS idx_admin_revenues_status ON admin_revenues(status);
CREATE INDEX IF NOT EXISTS idx_admin_revenues_created_at ON admin_revenues(created_at);

-- Enable Row Level Security
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finance_transactions
CREATE POLICY "Finance transactions are viewable by admins" ON finance_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Finance transactions are insertable by admins" ON finance_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for vendor_commissions
CREATE POLICY "Vendor commissions are viewable by admins and vendors" ON vendor_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role IN ('admin', 'super_admin') OR profiles.id = vendor_id)
    )
  );

CREATE POLICY "Vendor commissions are insertable by system" ON vendor_commissions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for vendor_payouts
CREATE POLICY "Vendor payouts are viewable by admins and vendors" ON vendor_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role IN ('admin', 'super_admin') OR profiles.id = vendor_id)
    )
  );

CREATE POLICY "Vendor payouts are manageable by admins" ON vendor_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for admin_revenues
CREATE POLICY "Admin revenues are viewable by admins only" ON admin_revenues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin revenues are manageable by admins" ON admin_revenues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for financial_reports
CREATE POLICY "Financial reports are viewable by admins only" ON financial_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Financial reports are manageable by admins" ON financial_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function to calculate and create commission records when an order is completed
CREATE OR REPLACE FUNCTION calculate_order_commissions(order_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  order_item RECORD;
  vendor_record RECORD;
  commission_rate DECIMAL(5,2);
  commission_amount DECIMAL(10,2);
  admin_amount DECIMAL(10,2);
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', order_uuid;
  END IF;

  -- Process each order item
  FOR order_item IN 
    SELECT oi.*, p.vendor_id 
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid
  LOOP
    -- Skip if no vendor (admin products)
    IF order_item.vendor_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Get vendor commission rate
    SELECT commission_rate INTO commission_rate
    FROM vendor_profiles 
    WHERE id = order_item.vendor_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendor profile not found for vendor: %', order_item.vendor_id;
    END IF;

    -- Calculate commission amounts
    -- commission_rate is the admin's percentage, so admin gets commission_rate% and vendor gets the rest
    admin_amount := (order_item.total_price * commission_rate) / 100;
    commission_amount := order_item.total_price - admin_amount;

    -- Insert commission record
    INSERT INTO vendor_commissions (
      order_id, vendor_id, order_item_id, product_id,
      commission_rate, order_amount, commission_amount, admin_amount,
      status
    ) VALUES (
      order_uuid, order_item.vendor_id, order_item.id, order_item.product_id,
      commission_rate, order_item.total_price, commission_amount, admin_amount,
      'pending'
    );

    -- Create finance transaction for vendor commission (what vendor earns)
    INSERT INTO finance_transactions (
      transaction_type, order_id, vendor_id, amount, description, status
    ) VALUES (
      'sale_commission', order_uuid, order_item.vendor_id, commission_amount,
      'Vendor commission for order ' || order_record.order_number, 'completed'
    );

    -- Create finance transaction for admin revenue (admin's commission)
    INSERT INTO finance_transactions (
      transaction_type, order_id, vendor_id, amount, description, status
    ) VALUES (
      'admin_revenue', order_uuid, order_item.vendor_id, admin_amount,
      'Admin commission from order ' || order_record.order_number, 'completed'
    );

    -- Update admin_revenues table
    INSERT INTO admin_revenues (
      revenue_type, source_id, source_type, amount, description
    ) VALUES (
      'commission', order_item.vendor_id, 'vendor', admin_amount,
      'Admin commission (' || commission_rate || '%) from vendor for order ' || order_record.order_number
    );

  END LOOP;
END;
$$;

-- Function to get vendor financial summary
CREATE OR REPLACE FUNCTION get_vendor_financial_summary(
  vendor_uuid UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_orders BIGINT,
  total_sales DECIMAL(12,2),
  total_commission DECIMAL(12,2),
  pending_commission DECIMAL(12,2),
  paid_commission DECIMAL(12,2),
  average_commission_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT vc.order_id) as total_orders,
    COALESCE(SUM(vc.order_amount), 0) as total_sales,
    COALESCE(SUM(vc.commission_amount), 0) as total_commission,
    COALESCE(SUM(CASE WHEN vc.status = 'pending' THEN vc.commission_amount ELSE 0 END), 0) as pending_commission,
    COALESCE(SUM(CASE WHEN vc.status = 'paid' THEN vc.commission_amount ELSE 0 END), 0) as paid_commission,
    COALESCE(AVG(vc.commission_rate), 0) as average_commission_rate
  FROM vendor_commissions vc
  WHERE vc.vendor_id = vendor_uuid
    AND (start_date IS NULL OR vc.created_at::date >= start_date)
    AND (end_date IS NULL OR vc.created_at::date <= end_date);
END;
$$;

-- Function to get admin financial summary
CREATE OR REPLACE FUNCTION get_admin_financial_summary(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_revenue DECIMAL(12,2),
  commission_revenue DECIMAL(12,2),
  subscription_revenue DECIMAL(12,2),
  advertising_revenue DECIMAL(12,2),
  other_revenue DECIMAL(12,2),
  total_transactions BIGINT,
  pending_payouts DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ar.amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN ar.revenue_type = 'commission' THEN ar.amount ELSE 0 END), 0) as commission_revenue,
    COALESCE(SUM(CASE WHEN ar.revenue_type = 'subscription' THEN ar.amount ELSE 0 END), 0) as subscription_revenue,
    COALESCE(SUM(CASE WHEN ar.revenue_type = 'advertising' THEN ar.amount ELSE 0 END), 0) as advertising_revenue,
    COALESCE(SUM(CASE WHEN ar.revenue_type NOT IN ('commission', 'subscription', 'advertising') THEN ar.amount ELSE 0 END), 0) as other_revenue,
    COUNT(ar.id) as total_transactions,
    COALESCE(SUM(CASE WHEN vp.status = 'pending' THEN vp.total_commission ELSE 0 END), 0) as pending_payouts
  FROM admin_revenues ar
  LEFT JOIN vendor_payouts vp ON vp.status = 'pending'
  WHERE (start_date IS NULL OR ar.created_at::date >= start_date)
    AND (end_date IS NULL OR ar.created_at::date <= end_date);
END;
$$;

-- Trigger to automatically calculate commissions when payment status changes to 'paid'
CREATE OR REPLACE FUNCTION trigger_calculate_commissions_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only calculate commissions when payment is marked as paid and wasn't paid before
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM calculate_order_commissions(NEW.order_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_commissions_on_payment_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_commissions_on_payment();

-- Add some sample data for testing (optional)
-- This can be removed in production
INSERT INTO admin_revenues (revenue_type, source_type, amount, description, status) VALUES
('subscription', 'vendor', 99.00, 'Monthly subscription fee', 'confirmed'),
('advertising', 'advertiser', 500.00, 'Banner advertising revenue', 'confirmed'),
('listing_fee', 'vendor', 25.00, 'Product listing fee', 'confirmed')
ON CONFLICT DO NOTHING;
