-- Create return policies table
CREATE TABLE return_policies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  is_returnable BOOLEAN NOT NULL DEFAULT false,
  return_days INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create COD policies table
CREATE TABLE cod_policies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  is_cod_allowed BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cancellation policies table
CREATE TABLE cancellation_policies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  is_cancelable BOOLEAN NOT NULL DEFAULT false,
  cancel_until_status TEXT CHECK (cancel_until_status IN ('pending', 'processing', 'shipped')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key columns to products table
ALTER TABLE products 
ADD COLUMN return_policy_id UUID REFERENCES return_policies(id),
ADD COLUMN cod_policy_id UUID REFERENCES cod_policies(id),
ADD COLUMN cancellation_policy_id UUID REFERENCES cancellation_policies(id);

-- Insert default policies
INSERT INTO return_policies (id, name, is_returnable, return_days, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', '14 Day Return', true, 14, 'Items can be returned within 14 days of delivery'),
('550e8400-e29b-41d4-a716-446655440002', '30 Day Return', true, 30, 'Items can be returned within 30 days of delivery'),
('550e8400-e29b-41d4-a716-446655440003', '7 Day Return', true, 7, 'Items can be returned within 7 days of delivery'),
('550e8400-e29b-41d4-a716-446655440004', 'No Returns', false, 0, 'This item cannot be returned'),
('550e8400-e29b-41d4-a716-446655440005', 'Exchange Only', false, 0, 'This item can only be exchanged, not returned for refund');

INSERT INTO cod_policies (id, name, is_cod_allowed, description) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'COD Allowed', true, 'Cash on Delivery is accepted for this product'),
('550e8400-e29b-41d4-a716-446655440102', 'Prepaid Only', false, 'Only prepaid orders are accepted for this product'),
('550e8400-e29b-41d4-a716-446655440103', 'COD with Conditions', true, 'COD available with additional charges and restrictions'),
('550e8400-e29b-41d4-a716-446655440104', 'No COD', false, 'Cash on Delivery is not available for this product');

INSERT INTO cancellation_policies (id, name, is_cancelable, cancel_until_status, description) VALUES
('550e8400-e29b-41d4-a716-446655440201', 'Cancelable until Shipped', true, 'shipped', 'Orders can be cancelled until the item is shipped'),
('550e8400-e29b-41d4-a716-446655440202', 'Cancelable until Processing', true, 'processing', 'Orders can be cancelled until processing begins'),
('550e8400-e29b-41d4-a716-446655440203', 'Cancelable until Confirmed', true, 'pending', 'Orders can be cancelled until confirmed'),
('550e8400-e29b-41d4-a716-446655440204', 'Non-cancelable', false, 'pending', 'Orders cannot be cancelled once placed'),
('550e8400-e29b-41d4-a716-446655440205', 'Cancelable with Fee', true, 'shipped', 'Orders can be cancelled until shipped with a cancellation fee');

-- Create indexes for better performance
CREATE INDEX idx_products_return_policy_id ON products(return_policy_id);
CREATE INDEX idx_products_cod_policy_id ON products(cod_policy_id);
CREATE INDEX idx_products_cancellation_policy_id ON products(cancellation_policy_id);
CREATE INDEX idx_return_policies_is_active ON return_policies(is_active);
CREATE INDEX idx_cod_policies_is_active ON cod_policies(is_active);
CREATE INDEX idx_cancellation_policies_is_active ON cancellation_policies(is_active);

-- Add comments for documentation
COMMENT ON TABLE return_policies IS 'Defines return policies for products including return period and conditions';
COMMENT ON TABLE cod_policies IS 'Defines Cash on Delivery policies for products';
COMMENT ON TABLE cancellation_policies IS 'Defines order cancellation policies including when cancellation is allowed';
COMMENT ON COLUMN products.return_policy_id IS 'Foreign key to return_policies table';
COMMENT ON COLUMN products.cod_policy_id IS 'Foreign key to cod_policies table';
COMMENT ON COLUMN products.cancellation_policy_id IS 'Foreign key to cancellation_policies table';

