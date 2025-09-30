-- Delivery System Migration
-- This migration creates the complete delivery system for products

-- Create pickup_locations table
CREATE TABLE pickup_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address_line TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_methods table
CREATE TABLE delivery_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_rates table
CREATE TABLE delivery_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pickup_city TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_method_id UUID REFERENCES delivery_methods(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  estimated_min_days INTEGER NOT NULL,
  estimated_max_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pickup_city, delivery_city, delivery_method_id)
);

-- Create product_delivery_options table
CREATE TABLE product_delivery_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  pickup_location_id UUID REFERENCES pickup_locations(id) ON DELETE CASCADE,
  delivery_method_id UUID REFERENCES delivery_methods(id) ON DELETE CASCADE,
  is_free_delivery BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, pickup_location_id, delivery_method_id)
);

-- Create product_delivery_zones table
CREATE TABLE product_delivery_zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  is_allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, city, country)
);

-- Insert default delivery methods
INSERT INTO delivery_methods (id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440301', 'Standard Delivery', 'Regular delivery service with standard processing time'),
('550e8400-e29b-41d4-a716-446655440302', 'Express Delivery', 'Fast delivery service with expedited processing'),
('550e8400-e29b-41d4-a716-446655440303', 'Cargo Company', 'Delivery through third-party cargo company'),
('550e8400-e29b-41d4-a716-446655440304', 'Same Day Delivery', 'Delivery on the same day for local orders'),
('550e8400-e29b-41d4-a716-446655440305', 'Next Day Delivery', 'Delivery on the next business day');

-- Insert sample pickup locations (you can modify these based on your actual vendors)
INSERT INTO pickup_locations (id, vendor_id, name, country, city, address_line, contact_phone, contact_email) VALUES
('550e8400-e29b-41d4-a716-446655440401', 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 
 'Main Warehouse', 'USA', 'New York', '123 Main St, Warehouse District', '+1-555-0123', 'warehouse@example.com'),
('550e8400-e29b-41d4-a716-446655440402', 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 
 'West Coast Hub', 'USA', 'Los Angeles', '456 Commerce Ave', '+1-555-0456', 'westcoast@example.com'),
('550e8400-e29b-41d4-a716-446655440403', 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 
 'Central Distribution', 'USA', 'Chicago', '789 Industrial Blvd', '+1-555-0789', 'central@example.com');

-- Insert sample delivery rates
INSERT INTO delivery_rates (pickup_city, delivery_city, delivery_method_id, price, estimated_min_days, estimated_max_days) VALUES
-- New York to other cities
('New York', 'Los Angeles', '550e8400-e29b-41d4-a716-446655440301', 15.99, 3, 5),
('New York', 'Los Angeles', '550e8400-e29b-41d4-a716-446655440302', 25.99, 1, 2),
('New York', 'Chicago', '550e8400-e29b-41d4-a716-446655440301', 8.99, 2, 3),
('New York', 'Chicago', '550e8400-e29b-41d4-a716-446655440302', 15.99, 1, 1),
('New York', 'Miami', '550e8400-e29b-41d4-a716-446655440301', 12.99, 2, 4),
('New York', 'Miami', '550e8400-e29b-41d4-a716-446655440302', 19.99, 1, 2),

-- Los Angeles to other cities
('Los Angeles', 'New York', '550e8400-e29b-41d4-a716-446655440301', 15.99, 3, 5),
('Los Angeles', 'New York', '550e8400-e29b-41d4-a716-446655440302', 25.99, 1, 2),
('Los Angeles', 'Chicago', '550e8400-e29b-41d4-a716-446655440301', 12.99, 2, 4),
('Los Angeles', 'Chicago', '550e8400-e29b-41d4-a716-446655440302', 19.99, 1, 2),
('Los Angeles', 'Seattle', '550e8400-e29b-41d4-a716-446655440301', 8.99, 1, 2),
('Los Angeles', 'Seattle', '550e8400-e29b-41d4-a716-446655440302', 15.99, 1, 1),

-- Chicago to other cities
('Chicago', 'New York', '550e8400-e29b-41d4-a716-446655440301', 8.99, 2, 3),
('Chicago', 'New York', '550e8400-e29b-41d4-a716-446655440302', 15.99, 1, 1),
('Chicago', 'Los Angeles', '550e8400-e29b-41d4-a716-446655440301', 12.99, 2, 4),
('Chicago', 'Los Angeles', '550e8400-e29b-41d4-a716-446655440302', 19.99, 1, 2),
('Chicago', 'Detroit', '550e8400-e29b-41d4-a716-446655440301', 5.99, 1, 2),
('Chicago', 'Detroit', '550e8400-e29b-41d4-a716-446655440302', 9.99, 1, 1);

-- Create indexes for better performance
CREATE INDEX idx_pickup_locations_vendor_id ON pickup_locations(vendor_id);
CREATE INDEX idx_pickup_locations_city ON pickup_locations(city);
CREATE INDEX idx_pickup_locations_country ON pickup_locations(country);
CREATE INDEX idx_pickup_locations_is_active ON pickup_locations(is_active);

CREATE INDEX idx_delivery_methods_is_active ON delivery_methods(is_active);

CREATE INDEX idx_delivery_rates_pickup_city ON delivery_rates(pickup_city);
CREATE INDEX idx_delivery_rates_delivery_city ON delivery_rates(delivery_city);
CREATE INDEX idx_delivery_rates_delivery_method_id ON delivery_rates(delivery_method_id);
CREATE INDEX idx_delivery_rates_is_active ON delivery_rates(is_active);

CREATE INDEX idx_product_delivery_options_product_id ON product_delivery_options(product_id);
CREATE INDEX idx_product_delivery_options_pickup_location_id ON product_delivery_options(pickup_location_id);
CREATE INDEX idx_product_delivery_options_delivery_method_id ON product_delivery_options(delivery_method_id);

CREATE INDEX idx_product_delivery_zones_product_id ON product_delivery_zones(product_id);
CREATE INDEX idx_product_delivery_zones_city ON product_delivery_zones(city);
CREATE INDEX idx_product_delivery_zones_country ON product_delivery_zones(country);
CREATE INDEX idx_product_delivery_zones_is_allowed ON product_delivery_zones(is_allowed);

-- Enable RLS on new tables
ALTER TABLE pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_delivery_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pickup_locations
CREATE POLICY "Anyone can view active pickup locations" ON pickup_locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can manage their own pickup locations" ON pickup_locations
  FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Staff can manage all pickup locations" ON pickup_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- RLS Policies for delivery_methods
CREATE POLICY "Anyone can view active delivery methods" ON delivery_methods
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage delivery methods" ON delivery_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- RLS Policies for delivery_rates
CREATE POLICY "Anyone can view active delivery rates" ON delivery_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage delivery rates" ON delivery_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- RLS Policies for product_delivery_options
CREATE POLICY "Anyone can view product delivery options" ON product_delivery_options
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage product delivery options" ON product_delivery_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- RLS Policies for product_delivery_zones
CREATE POLICY "Anyone can view product delivery zones" ON product_delivery_zones
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage product delivery zones" ON product_delivery_zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_pickup_locations_updated_at 
  BEFORE UPDATE ON pickup_locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_methods_updated_at 
  BEFORE UPDATE ON delivery_methods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_rates_updated_at 
  BEFORE UPDATE ON delivery_rates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_delivery_options_updated_at 
  BEFORE UPDATE ON product_delivery_options 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_delivery_zones_updated_at 
  BEFORE UPDATE ON product_delivery_zones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE pickup_locations IS 'Stores vendor pickup locations with address information';
COMMENT ON TABLE delivery_methods IS 'Available delivery methods (Standard, Express, etc.)';
COMMENT ON TABLE delivery_rates IS 'Pricing and timing for delivery between cities using specific methods';
COMMENT ON TABLE product_delivery_options IS 'Links products to pickup locations and delivery methods with free delivery flags';
COMMENT ON TABLE product_delivery_zones IS 'Defines which cities products can be delivered to';

COMMENT ON COLUMN pickup_locations.vendor_id IS 'Foreign key to profiles table for vendor';
COMMENT ON COLUMN pickup_locations.country IS 'Country where pickup location is located';
COMMENT ON COLUMN pickup_locations.city IS 'City where pickup location is located';
COMMENT ON COLUMN pickup_locations.address_line IS 'Optional specific address for pickup location';

COMMENT ON COLUMN delivery_rates.pickup_city IS 'City where delivery originates from';
COMMENT ON COLUMN delivery_rates.delivery_city IS 'City where delivery is going to';
COMMENT ON COLUMN delivery_rates.price IS 'Cost for this delivery route and method';
COMMENT ON COLUMN delivery_rates.estimated_min_days IS 'Minimum estimated delivery days';
COMMENT ON COLUMN delivery_rates.estimated_max_days IS 'Maximum estimated delivery days';

COMMENT ON COLUMN product_delivery_options.is_free_delivery IS 'Whether this product has free delivery for this pickup/delivery method combination';
COMMENT ON COLUMN product_delivery_zones.is_allowed IS 'Whether delivery to this city is allowed (true) or restricted (false)';




