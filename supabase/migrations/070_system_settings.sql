-- System Settings Migration
-- This migration creates tables and storage for system-wide settings including logos and icons

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json', 'url', 'email')),
  category TEXT DEFAULT 'general',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_images table for logos and icons
CREATE TABLE IF NOT EXISTS system_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_type TEXT NOT NULL CHECK (image_type IN ('logo', 'favicon', 'icon', 'banner', 'background')),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for system images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-images', 
  'system-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for system images
CREATE POLICY "Allow authenticated users to upload system images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'system-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to view system images" ON storage.objects
FOR SELECT USING (bucket_id = 'system-images');

CREATE POLICY "Allow authenticated users to update system images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'system-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete system images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'system-images' AND 
  auth.role() = 'authenticated'
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('app_name', 'Suuqsade Marketplace', 'text', 'general', 'Application name displayed throughout the site', true),
('app_description', 'A modern e-commerce marketplace platform', 'text', 'general', 'Application description for SEO and branding', true),
('app_tagline', 'Your trusted marketplace', 'text', 'general', 'Application tagline', true),
('default_currency', 'USD', 'text', 'localization', 'Default currency for the application', true),
('default_language', 'en', 'text', 'localization', 'Default language code', true),
('timezone', 'UTC', 'text', 'localization', 'Default timezone', false),
('maintenance_mode', 'false', 'boolean', 'system', 'Enable maintenance mode', false),
('debug_mode', 'false', 'boolean', 'system', 'Enable debug mode', false),
('max_upload_size', '5242880', 'number', 'system', 'Maximum file upload size in bytes', false),
('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]', 'json', 'system', 'Allowed file types for uploads', false),
('contact_email', 'support@suuqsade.com', 'email', 'contact', 'Primary contact email', true),
('support_email', 'support@suuqsade.com', 'email', 'contact', 'Support email address', true),
('admin_email', 'admin@suuqsade.com', 'email', 'contact', 'Admin email address', false),
('phone_number', '+1-555-0123', 'text', 'contact', 'Primary phone number', true),
('address', '123 Business St, City, State 12345', 'text', 'contact', 'Business address', true),
('facebook_url', '', 'url', 'social', 'Facebook page URL', true),
('twitter_url', '', 'url', 'social', 'Twitter profile URL', true),
('instagram_url', '', 'url', 'social', 'Instagram profile URL', true),
('linkedin_url', '', 'url', 'social', 'LinkedIn profile URL', true),
('youtube_url', '', 'url', 'social', 'YouTube channel URL', true),
('terms_of_service_url', '', 'url', 'legal', 'Terms of service page URL', true),
('privacy_policy_url', '', 'url', 'legal', 'Privacy policy page URL', true),
('refund_policy_url', '', 'url', 'legal', 'Refund policy page URL', true),
('shipping_policy_url', '', 'url', 'legal', 'Shipping policy page URL', true),
('meta_title', 'Suuqsade Marketplace - Your Trusted Online Store', 'text', 'seo', 'Default meta title for SEO', true),
('meta_description', 'Discover amazing products at Suuqsade Marketplace. Quality items, great prices, and excellent service.', 'text', 'seo', 'Default meta description for SEO', true),
('meta_keywords', 'marketplace, ecommerce, online shopping, products, deals', 'text', 'seo', 'Default meta keywords for SEO', true),
('google_analytics_id', '', 'text', 'analytics', 'Google Analytics tracking ID', false),
('facebook_pixel_id', '', 'text', 'analytics', 'Facebook Pixel ID', false),
('recaptcha_site_key', '', 'text', 'security', 'Google reCAPTCHA site key', false),
('recaptcha_secret_key', '', 'text', 'security', 'Google reCAPTCHA secret key', false),
('smtp_host', '', 'text', 'email', 'SMTP server host', false),
('smtp_port', '587', 'number', 'email', 'SMTP server port', false),
('smtp_username', '', 'text', 'email', 'SMTP username', false),
('smtp_password', '', 'text', 'email', 'SMTP password', false),
('smtp_from_email', '', 'email', 'email', 'SMTP from email address', false),
('smtp_from_name', '', 'text', 'email', 'SMTP from name', false),
('payment_gateway', 'stripe', 'text', 'payment', 'Primary payment gateway', false),
('stripe_public_key', '', 'text', 'payment', 'Stripe public key', false),
('stripe_secret_key', '', 'text', 'payment', 'Stripe secret key', false),
('paypal_client_id', '', 'text', 'payment', 'PayPal client ID', false),
('paypal_client_secret', '', 'text', 'payment', 'PayPal client secret', false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_system_images_type ON system_images(image_type);
CREATE INDEX IF NOT EXISTS idx_system_images_active ON system_images(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_system_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

CREATE TRIGGER trigger_update_system_images_updated_at
  BEFORE UPDATE ON system_images
  FOR EACH ROW
  EXECUTE FUNCTION update_system_images_updated_at();

-- Create RLS policies for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to public settings
CREATE POLICY "Allow public read access to public settings" ON system_settings
FOR SELECT USING (is_public = true);

-- Allow authenticated users to read all settings
CREATE POLICY "Allow authenticated users to read all settings" ON system_settings
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins to modify settings
CREATE POLICY "Allow admins to modify settings" ON system_settings
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create RLS policies for system_images
ALTER TABLE system_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active images
CREATE POLICY "Allow public read access to active images" ON system_images
FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all images
CREATE POLICY "Allow authenticated users to read all images" ON system_images
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins to modify images
CREATE POLICY "Allow admins to modify images" ON system_images
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create function to get setting value by key
CREATE OR REPLACE FUNCTION get_setting(setting_key_param TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT setting_value INTO setting_value
  FROM system_settings
  WHERE setting_key = setting_key_param;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set setting value by key
CREATE OR REPLACE FUNCTION set_setting(setting_key_param TEXT, setting_value_param TEXT, setting_type_param TEXT DEFAULT 'text')
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO system_settings (setting_key, setting_value, setting_type)
  VALUES (setting_key_param, setting_value_param, setting_type_param)
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    setting_type = EXCLUDED.setting_type,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all public settings
CREATE OR REPLACE FUNCTION get_public_settings()
RETURNS TABLE(setting_key TEXT, setting_value TEXT, setting_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ss.setting_key, ss.setting_value, ss.setting_type
  FROM system_settings ss
  WHERE ss.is_public = true
  ORDER BY ss.setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_setting(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_setting(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_settings() TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE system_settings IS 'Stores system-wide configuration settings';
COMMENT ON TABLE system_images IS 'Stores system logos, icons, and other images';
COMMENT ON FUNCTION get_setting(TEXT) IS 'Retrieves a setting value by key';
COMMENT ON FUNCTION set_setting(TEXT, TEXT, TEXT) IS 'Sets a setting value by key';
COMMENT ON FUNCTION get_public_settings() IS 'Retrieves all public settings for frontend use';
