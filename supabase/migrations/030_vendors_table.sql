-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT NOT NULL,
  logo_url TEXT,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_business_name ON vendors(business_name);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at);

-- Add vendor_id to products table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'vendor_id') THEN
    ALTER TABLE products ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
  END IF;
END $$;

-- Add vendor_id to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vendor_id') THEN
    ALTER TABLE orders ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors
CREATE POLICY "Vendors are viewable by everyone" ON vendors
  FOR SELECT USING (true);

CREATE POLICY "Vendors are insertable by authenticated users" ON vendors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Vendors are updatable by authenticated users" ON vendors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Vendors are deletable by authenticated users" ON vendors
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

-- Insert some sample vendors
INSERT INTO vendors (business_name, business_description, contact_person, email, password_hash, phone, address, city, district, neighborhood, country, tax_id, commission_rate, status) VALUES
('Tech Solutions Inc', 'Leading provider of innovative software solutions and IT consulting services. We specialize in custom web applications, mobile development, and cloud infrastructure.', 'John Smith', 'john@techsolutions.com', '$2a$10$rQZ8K9vL2mN3pQ4rS5tU6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5', '+1-555-0123', '123 Tech Street, Suite 100', 'San Francisco', 'Downtown', 'Financial District', 'USA', 'TAX-123456789', 8.50, 'active'),
('Fashion Forward', 'Contemporary fashion brand offering trendy clothing and accessories for modern women. We focus on sustainable fashion and ethical manufacturing practices.', 'Sarah Johnson', 'sarah@fashionforward.com', '$2a$10$rQZ8K9vL2mN3pQ4rS5tU6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5', '+1-555-0124', '456 Fashion Ave, Floor 2', 'New York', 'Manhattan', 'SoHo', 'USA', 'TAX-987654321', 12.00, 'active'),
('Home & Garden Co', 'Your one-stop shop for home improvement and garden supplies. We offer quality tools, plants, furniture, and expert advice for all your home and garden needs.', 'Mike Wilson', 'mike@homegarden.com', '$2a$10$rQZ8K9vL2mN3pQ4rS5tU6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5', '+1-555-0125', '789 Garden Lane, Building A', 'Los Angeles', 'Westside', 'Beverly Hills', 'USA', 'TAX-456789123', 10.00, 'pending'),
('Electronics Plus', 'Premium electronics retailer specializing in the latest gadgets, computers, and home entertainment systems. We provide expert technical support and warranty services.', 'Lisa Brown', 'lisa@electronicsplus.com', '$2a$10$rQZ8K9vL2mN3pQ4rS5tU6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5', '+1-555-0126', '321 Electric Blvd, Unit 5', 'Chicago', 'Loop', 'Downtown', 'USA', 'TAX-789123456', 7.50, 'active'),
('Sports World', 'Complete sports equipment and apparel store for athletes of all levels. From professional gear to recreational equipment, we have everything you need for your active lifestyle.', 'David Lee', 'david@sportsworld.com', '$2a$10$rQZ8K9vL2mN3pQ4rS5tU6uV7wX8yZ9aA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5', '+1-555-0127', '654 Sports Center, Plaza Level', 'Miami', 'Downtown', 'Brickell', 'USA', 'TAX-321654987', 15.00, 'inactive')
ON CONFLICT (email) DO NOTHING;
