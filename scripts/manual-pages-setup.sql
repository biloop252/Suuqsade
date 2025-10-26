-- Manual pages table creation script
-- Run this if the migration didn't work

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to published pages" ON pages
FOR SELECT USING (status = 'published');

CREATE POLICY "Allow authenticated users to read all pages" ON pages
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to modify pages" ON pages
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
'info', 'published', false, 6)
ON CONFLICT (slug) DO NOTHING;

