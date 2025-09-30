-- Add vendor role to existing user_role enum
ALTER TYPE user_role ADD VALUE 'vendor';

-- Create vendor_profiles table that extends profiles
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT NOT NULL,
  logo_url TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  tax_id VARCHAR(100) NOT NULL,
  business_license_url TEXT,
  national_id_url TEXT,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_business_name ON vendor_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_status ON vendor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_commission_rate ON vendor_profiles(commission_rate);

-- Enable Row Level Security
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendor_profiles
CREATE POLICY "Vendor profiles are viewable by everyone" ON vendor_profiles
  FOR SELECT USING (true);

CREATE POLICY "Vendor profiles are insertable by authenticated users" ON vendor_profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Vendor profiles are updatable by the vendor or admin" ON vendor_profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Vendor profiles are deletable by admin" ON vendor_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_vendor_profiles_updated_at
  BEFORE UPDATE ON vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_profiles_updated_at();

-- Add vendor_id to products table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'vendor_id') THEN
    ALTER TABLE products ADD COLUMN vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
  END IF;
END $$;

-- Add vendor_id to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vendor_id') THEN
    ALTER TABLE orders ADD COLUMN vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
  END IF;
END $$;

-- Insert some sample vendor profiles
-- First, create sample profiles with vendor role
INSERT INTO profiles (id, email, first_name, last_name, phone, role, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'john@techsolutions.com', 'John', 'Smith', '+1-555-0123', 'vendor', true),
('550e8400-e29b-41d4-a716-446655440011', 'sarah@fashionforward.com', 'Sarah', 'Johnson', '+1-555-0124', 'vendor', true),
('550e8400-e29b-41d4-a716-446655440012', 'mike@homegarden.com', 'Mike', 'Wilson', '+1-555-0125', 'vendor', true),
('550e8400-e29b-41d4-a716-446655440013', 'lisa@electronicsplus.com', 'Lisa', 'Brown', '+1-555-0126', 'vendor', true),
('550e8400-e29b-41d4-a716-446655440014', 'david@sportsworld.com', 'David', 'Lee', '+1-555-0127', 'vendor', true)
ON CONFLICT (id) DO NOTHING;

-- Then create vendor profiles
INSERT INTO vendor_profiles (id, business_name, business_description, address, city, district, neighborhood, country, tax_id, commission_rate, status) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Tech Solutions Inc', 'Leading provider of innovative software solutions and IT consulting services. We specialize in custom web applications, mobile development, and cloud infrastructure.', '123 Tech Street, Suite 100', 'San Francisco', 'Downtown', 'Financial District', 'USA', 'TAX-123456789', 8.50, 'active'),
('550e8400-e29b-41d4-a716-446655440011', 'Fashion Forward', 'Contemporary fashion brand offering trendy clothing and accessories for modern women. We focus on sustainable fashion and ethical manufacturing practices.', '456 Fashion Ave, Floor 2', 'New York', 'Manhattan', 'SoHo', 'USA', 'TAX-987654321', 12.00, 'active'),
('550e8400-e29b-41d4-a716-446655440012', 'Home & Garden Co', 'Your one-stop shop for home improvement and garden supplies. We offer quality tools, plants, furniture, and expert advice for all your home and garden needs.', '789 Garden Lane, Building A', 'Los Angeles', 'Westside', 'Beverly Hills', 'USA', 'TAX-456789123', 10.00, 'pending'),
('550e8400-e29b-41d4-a716-446655440013', 'Electronics Plus', 'Premium electronics retailer specializing in the latest gadgets, computers, and home entertainment systems. We provide expert technical support and warranty services.', '321 Electric Blvd, Unit 5', 'Chicago', 'Loop', 'Downtown', 'USA', 'TAX-789123456', 7.50, 'active'),
('550e8400-e29b-41d4-a716-446655440014', 'Sports World', 'Complete sports equipment and apparel store for athletes of all levels. From professional gear to recreational equipment, we have everything you need for your active lifestyle.', '654 Sports Center, Plaza Level', 'Miami', 'Downtown', 'Brickell', 'USA', 'TAX-321654987', 15.00, 'inactive')
ON CONFLICT (id) DO NOTHING;

-- Create a function to promote a user to vendor
CREATE OR REPLACE FUNCTION promote_user_to_vendor(
  user_id UUID,
  business_name VARCHAR(255),
  business_description TEXT,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  neighborhood VARCHAR(100),
  country VARCHAR(100),
  tax_id VARCHAR(100),
  commission_rate DECIMAL(5,2) DEFAULT 10.00
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user role to vendor
  UPDATE profiles 
  SET role = 'vendor' 
  WHERE id = user_id;
  
  -- Insert vendor profile
  INSERT INTO vendor_profiles (
    id, business_name, business_description, 
    address, city, district, neighborhood, country, 
    tax_id, commission_rate, status
  ) VALUES (
    user_id, business_name, business_description,
    address, city, district, neighborhood, country,
    tax_id, commission_rate, 'pending'
  );
  
  RETURN user_id;
END;
$$;

-- Create a function to get vendor profile with user info
CREATE OR REPLACE FUNCTION get_vendor_with_profile(vendor_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role,
  is_active BOOLEAN,
  business_name VARCHAR(255),
  business_description TEXT,
  logo_url TEXT,
  address TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  neighborhood VARCHAR(100),
  country VARCHAR(100),
  tax_id VARCHAR(100),
  business_license_url TEXT,
  national_id_url TEXT,
  commission_rate DECIMAL(5,2),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.avatar_url,
    p.role,
    p.is_active,
    vp.business_name,
    vp.business_description,
    vp.logo_url,
    vp.address,
    vp.city,
    vp.district,
    vp.neighborhood,
    vp.country,
    vp.tax_id,
    vp.business_license_url,
    vp.national_id_url,
    vp.commission_rate,
    vp.status,
    vp.created_at,
    vp.updated_at
  FROM profiles p
  JOIN vendor_profiles vp ON p.id = vp.id
  WHERE p.id = vendor_id AND p.role = 'vendor';
END;
$$;
