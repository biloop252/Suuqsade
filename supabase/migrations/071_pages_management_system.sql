-- Pages Management System Migration
-- This migration creates tables for managing static pages like About, Legal, Shipping Policy, etc.

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  page_type TEXT DEFAULT 'static' CHECK (page_type IN ('static', 'legal', 'policy', 'info')),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page_sections table for structured content
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_type TEXT DEFAULT 'content' CHECK (section_type IN ('content', 'hero', 'features', 'testimonials', 'cta', 'gallery')),
  title TEXT,
  content TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page_templates table for reusable templates
CREATE TABLE IF NOT EXISTS page_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_featured ON pages(is_featured);
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_type ON page_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_page_sections_sort_order ON page_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_page_templates_name ON page_templates(name);
CREATE INDEX IF NOT EXISTS idx_page_templates_active ON page_templates(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_page_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_page_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_pages_updated_at();

CREATE TRIGGER trigger_update_page_sections_updated_at
  BEFORE UPDATE ON page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_page_sections_updated_at();

CREATE TRIGGER trigger_update_page_templates_updated_at
  BEFORE UPDATE ON page_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_page_templates_updated_at();

-- Create RLS policies for pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published pages
CREATE POLICY "Allow public read access to published pages" ON pages
FOR SELECT USING (status = 'published');

-- Allow authenticated users to read all pages
CREATE POLICY "Allow authenticated users to read all pages" ON pages
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins to modify pages
CREATE POLICY "Allow admins to modify pages" ON pages
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create RLS policies for page_sections
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Allow public read access to sections of published pages
CREATE POLICY "Allow public read access to page sections" ON page_sections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = page_sections.page_id 
    AND pages.status = 'published'
  )
);

-- Allow authenticated users to read all page sections
CREATE POLICY "Allow authenticated users to read all page sections" ON page_sections
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins to modify page sections
CREATE POLICY "Allow admins to modify page sections" ON page_sections
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create RLS policies for page_templates
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active templates
CREATE POLICY "Allow authenticated users to read active templates" ON page_templates
FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Allow only admins to modify page templates
CREATE POLICY "Allow admins to modify page templates" ON page_templates
FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Insert default pages
INSERT INTO pages (slug, title, content, meta_title, meta_description, page_type, status, is_featured, sort_order) VALUES
('about', 'About Us', 
'<h1>About Suuqsade Marketplace</h1>
<p>Welcome to Suuqsade Marketplace, your trusted online destination for quality products and exceptional service.</p>

<h2>Our Story</h2>
<p>Founded with a vision to create a seamless shopping experience, Suuqsade Marketplace has grown to become a leading e-commerce platform. We connect customers with quality products from trusted vendors worldwide.</p>

<h2>Our Mission</h2>
<p>To provide customers with access to high-quality products at competitive prices while supporting vendors in growing their businesses through our platform.</p>

<h2>Our Values</h2>
<ul>
<li><strong>Quality:</strong> We ensure all products meet our high standards</li>
<li><strong>Trust:</strong> We build lasting relationships with our customers and vendors</li>
<li><strong>Innovation:</strong> We continuously improve our platform and services</li>
<li><strong>Customer Service:</strong> We prioritize customer satisfaction above all</li>
</ul>

<h2>Why Choose Us?</h2>
<p>With years of experience in e-commerce, we understand what customers need and what vendors require to succeed. Our platform offers:</p>
<ul>
<li>Secure payment processing</li>
<li>Fast and reliable delivery</li>
<li>Comprehensive customer support</li>
<li>Easy returns and exchanges</li>
<li>Regular promotions and discounts</li>
</ul>',
'About Us - Suuqsade Marketplace',
'Learn about Suuqsade Marketplace, our mission, values, and commitment to providing quality products and exceptional service.',
'static', 'published', true, 1),

('shipping-policy', 'Shipping Policy', 
'<h1>Shipping Policy</h1>
<p>We are committed to delivering your orders quickly and safely. Please review our shipping policy below.</p>

<h2>Shipping Methods</h2>
<p>We offer various shipping options to meet your needs:</p>
<ul>
<li><strong>Standard Shipping:</strong> 5-7 business days</li>
<li><strong>Express Shipping:</strong> 2-3 business days</li>
<li><strong>Overnight Shipping:</strong> Next business day (where available)</li>
</ul>

<h2>Shipping Costs</h2>
<p>Shipping costs are calculated based on:</p>
<ul>
<li>Package weight and dimensions</li>
<li>Delivery destination</li>
<li>Selected shipping method</li>
<li>Special handling requirements</li>
</ul>

<h2>Free Shipping</h2>
<p>We offer free standard shipping on orders over $50. Free shipping promotions may also be available during special events.</p>

<h2>Delivery Areas</h2>
<p>We currently ship to all 50 states in the United States. International shipping is available to select countries.</p>

<h2>Order Processing</h2>
<p>Orders are typically processed within 1-2 business days. You will receive a confirmation email with tracking information once your order ships.</p>

<h2>Delivery Issues</h2>
<p>If you experience any delivery issues, please contact our customer support team immediately. We will work with you to resolve any problems.</p>

<h2>Holiday Shipping</h2>
<p>During holiday periods, shipping times may be extended. Please check our website for current holiday shipping schedules.</p>',
'Shipping Policy - Suuqsade Marketplace',
'Review our shipping policy, including delivery methods, costs, and processing times for orders placed on Suuqsade Marketplace.',
'policy', 'published', false, 2),

('privacy-policy', 'Privacy Policy', 
'<h1>Privacy Policy</h1>
<p>Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.</p>

<h2>Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you:</p>
<ul>
<li>Create an account</li>
<li>Make a purchase</li>
<li>Contact customer support</li>
<li>Subscribe to our newsletter</li>
</ul>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
<li>Process and fulfill your orders</li>
<li>Provide customer support</li>
<li>Send you important updates about your account</li>
<li>Improve our services</li>
<li>Send promotional materials (with your consent)</li>
</ul>

<h2>Information Sharing</h2>
<p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>

<h2>Data Security</h2>
<p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>Cookies</h2>
<p>We use cookies and similar technologies to enhance your browsing experience and analyze site traffic.</p>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li>Access your personal information</li>
<li>Correct inaccurate information</li>
<li>Delete your account</li>
<li>Opt out of marketing communications</li>
</ul>

<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at privacy@suuqsade.com.</p>',
'Privacy Policy - Suuqsade Marketplace',
'Read our privacy policy to understand how we collect, use, and protect your personal information on Suuqsade Marketplace.',
'legal', 'published', false, 3),

('terms-of-service', 'Terms of Service', 
'<h1>Terms of Service</h1>
<p>Welcome to Suuqsade Marketplace. These Terms of Service govern your use of our platform.</p>

<h2>Acceptance of Terms</h2>
<p>By accessing or using our website, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>

<h2>Use License</h2>
<p>Permission is granted to temporarily download one copy of the materials on Suuqsade Marketplace for personal, non-commercial transitory viewing only.</p>

<h2>User Accounts</h2>
<p>When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account.</p>

<h2>Prohibited Uses</h2>
<p>You may not use our website:</p>
<ul>
<li>For any unlawful purpose</li>
<li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
<li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
<li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
<li>To submit false or misleading information</li>
</ul>

<h2>Product Information</h2>
<p>We strive to provide accurate product information, but we do not warrant that product descriptions or other content is accurate, complete, reliable, or error-free.</p>

<h2>Pricing and Payment</h2>
<p>All prices are subject to change without notice. Payment must be received before we ship your order.</p>

<h2>Returns and Refunds</h2>
<p>Please refer to our Return Policy for information about returns and refunds.</p>

<h2>Limitation of Liability</h2>
<p>In no event shall Suuqsade Marketplace or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.</p>

<h2>Governing Law</h2>
<p>These terms and conditions are governed by and construed in accordance with the laws of the United States.</p>

<h2>Changes to Terms</h2>
<p>We reserve the right to modify these terms at any time. Your continued use of the website constitutes acceptance of any changes.</p>',
'Terms of Service - Suuqsade Marketplace',
'Read our terms of service to understand the rules and regulations for using Suuqsade Marketplace.',
'legal', 'published', false, 4),

('careers', 'Careers', 
'<h1>Join Our Team</h1>
<p>We are always looking for talented individuals to join our growing team at Suuqsade Marketplace.</p>

<h2>Why Work With Us?</h2>
<p>At Suuqsade Marketplace, we offer:</p>
<ul>
<li>Competitive salaries and benefits</li>
<li>Flexible work arrangements</li>
<li>Professional development opportunities</li>
<li>A collaborative and inclusive work environment</li>
<li>Opportunities for growth and advancement</li>
</ul>

<h2>Current Openings</h2>
<p>We currently have openings in the following areas:</p>
<ul>
<li><strong>Software Development:</strong> Frontend and backend developers</li>
<li><strong>Marketing:</strong> Digital marketing specialists and content creators</li>
<li><strong>Customer Support:</strong> Customer service representatives</li>
<li><strong>Operations:</strong> Logistics and supply chain coordinators</li>
<li><strong>Sales:</strong> Business development and account managers</li>
</ul>

<h2>How to Apply</h2>
<p>To apply for a position:</p>
<ol>
<li>Browse our current job openings</li>
<li>Submit your resume and cover letter</li>
<li>Complete our online application form</li>
<li>Participate in our interview process</li>
</ol>

<h2>Internship Program</h2>
<p>We offer internship opportunities for students and recent graduates looking to gain experience in e-commerce and technology.</p>

<h2>Employee Benefits</h2>
<p>Our comprehensive benefits package includes:</p>
<ul>
<li>Health, dental, and vision insurance</li>
<li>401(k) retirement plan with company matching</li>
<li>Paid time off and holidays</li>
<li>Professional development budget</li>
<li>Employee discounts on products</li>
</ul>

<h2>Equal Opportunity Employer</h2>
<p>Suuqsade Marketplace is an equal opportunity employer committed to diversity and inclusion.</p>

<h2>Contact Us</h2>
<p>For questions about careers or to submit your application, please contact us at careers@suuqsade.com.</p>',
'Careers - Suuqsade Marketplace',
'Explore career opportunities at Suuqsade Marketplace. Join our team and help us build the future of e-commerce.',
'info', 'published', true, 5),

('contact', 'Contact Us', 
'<h1>Contact Us</h1>
<p>We would love to hear from you. Get in touch with us using any of the methods below.</p>

<h2>Customer Support</h2>
<p>For general inquiries and customer support:</p>
<ul>
<li><strong>Email:</strong> support@suuqsade.com</li>
<li><strong>Phone:</strong> +1-555-0123</li>
<li><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST</li>
</ul>

<h2>Business Inquiries</h2>
<p>For business partnerships and vendor applications:</p>
<ul>
<li><strong>Email:</strong> business@suuqsade.com</li>
<li><strong>Phone:</strong> +1-555-0124</li>
</ul>

<h2>Press and Media</h2>
<p>For media inquiries and press releases:</p>
<ul>
<li><strong>Email:</strong> press@suuqsade.com</li>
</ul>

<h2>Office Address</h2>
<p>Suuqsade Marketplace<br>
123 Business Street<br>
City, State 12345<br>
United States</p>

<h2>Social Media</h2>
<p>Follow us on social media for updates and news:</p>
<ul>
<li>Facebook: @suuqsademarketplace</li>
<li>Twitter: @suuqsade</li>
<li>Instagram: @suuqsademarketplace</li>
<li>LinkedIn: Suuqsade Marketplace</li>
</ul>

<h2>Feedback</h2>
<p>We value your feedback and suggestions. Please share your thoughts with us at feedback@suuqsade.com.</p>',
'Contact Us - Suuqsade Marketplace',
'Get in touch with Suuqsade Marketplace. Find our contact information, office address, and customer support details.',
'info', 'published', false, 6);

-- Insert default page templates
INSERT INTO page_templates (name, description, template_data, is_active) VALUES
('default', 'Default page template with basic content structure', 
'{"sections": [{"type": "hero", "title": "{{title}}", "content": "{{content}}", "sort_order": 1}]}', true),

('landing', 'Landing page template with hero, features, and CTA sections', 
'{"sections": [{"type": "hero", "title": "{{title}}", "content": "{{content}}", "sort_order": 1}, {"type": "features", "title": "Key Features", "sort_order": 2}, {"type": "cta", "title": "Get Started", "sort_order": 3}]}', true),

('legal', 'Legal page template for terms, privacy policy, etc.', 
'{"sections": [{"type": "content", "title": "{{title}}", "content": "{{content}}", "sort_order": 1}]}', true);

-- Create function to get page by slug
CREATE OR REPLACE FUNCTION get_page_by_slug(page_slug TEXT)
RETURNS TABLE(
  id UUID,
  slug TEXT,
  title TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  page_type TEXT,
  status TEXT,
  is_featured BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title,
    p.content,
    p.meta_title,
    p.meta_description,
    p.meta_keywords,
    p.page_type,
    p.status,
    p.is_featured,
    p.sort_order,
    p.created_at,
    p.updated_at
  FROM pages p
  WHERE p.slug = page_slug AND p.status = 'published'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all published pages
CREATE OR REPLACE FUNCTION get_published_pages()
RETURNS TABLE(
  id UUID,
  slug TEXT,
  title TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  page_type TEXT,
  is_featured BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title,
    p.content,
    p.meta_title,
    p.meta_description,
    p.page_type,
    p.is_featured,
    p.sort_order,
    p.created_at,
    p.updated_at
  FROM pages p
  WHERE p.status = 'published'
  ORDER BY p.sort_order ASC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_page_by_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_published_pages() TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE pages IS 'Stores static pages content like About, Legal, Policies, etc.';
COMMENT ON TABLE page_sections IS 'Stores structured content sections for pages';
COMMENT ON TABLE page_templates IS 'Stores reusable page templates';
COMMENT ON FUNCTION get_page_by_slug(TEXT) IS 'Retrieves a published page by its slug';
COMMENT ON FUNCTION get_published_pages() IS 'Retrieves all published pages ordered by sort order';

