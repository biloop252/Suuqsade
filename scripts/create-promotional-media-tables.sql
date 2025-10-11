-- Manual SQL script to create promotional media tables
-- Run this in your Supabase SQL Editor if migrations are failing

-- Create promotional media types enum
DO $$ BEGIN
    CREATE TYPE promotional_media_type AS ENUM ('slider', 'banner', 'popup', 'video', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create promotional media positions enum
DO $$ BEGIN
    CREATE TYPE promotional_media_position AS ENUM (
        'homepage_top',
        'homepage_middle', 
        'homepage_bottom',
        'category_page',
        'product_page',
        'sidebar',
        'footer',
        'popup',
        'header',
        'checkout_page',
        'cart_page'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create promotional media target enum
DO $$ BEGIN
    CREATE TYPE promotional_media_target AS ENUM ('_self', '_blank', '_parent', '_top');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create promotional media table
CREATE TABLE IF NOT EXISTS promotional_media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    media_type promotional_media_type NOT NULL,
    image_url TEXT,
    mobile_image_url TEXT,
    video_url TEXT,
    link_url TEXT,
    button_text TEXT,
    target promotional_media_target DEFAULT '_self',
    banner_position promotional_media_position NOT NULL,
    display_order INTEGER DEFAULT 0,
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#000000',
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    language_code TEXT DEFAULT 'en',
    store_id UUID,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotional media categories junction table
CREATE TABLE IF NOT EXISTS promotional_media_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    promotional_media_id UUID REFERENCES promotional_media(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(promotional_media_id, category_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotional_media_type ON promotional_media(media_type);
CREATE INDEX IF NOT EXISTS idx_promotional_media_position ON promotional_media(banner_position);
CREATE INDEX IF NOT EXISTS idx_promotional_media_active ON promotional_media(is_active);
CREATE INDEX IF NOT EXISTS idx_promotional_media_dates ON promotional_media(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotional_media_display_order ON promotional_media(display_order);
CREATE INDEX IF NOT EXISTS idx_promotional_media_created_by ON promotional_media(created_by);
CREATE INDEX IF NOT EXISTS idx_promotional_media_categories_media ON promotional_media_categories(promotional_media_id);
CREATE INDEX IF NOT EXISTS idx_promotional_media_categories_category ON promotional_media_categories(category_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotional_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_promotional_media_updated_at ON promotional_media;
CREATE TRIGGER trigger_update_promotional_media_updated_at
    BEFORE UPDATE ON promotional_media
    FOR EACH ROW
    EXECUTE FUNCTION update_promotional_media_updated_at();

-- Create function to get active promotional media by position
CREATE OR REPLACE FUNCTION get_active_promotional_media(
    position_param promotional_media_position,
    language_param TEXT DEFAULT 'en'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    media_type promotional_media_type,
    image_url TEXT,
    mobile_image_url TEXT,
    video_url TEXT,
    link_url TEXT,
    button_text TEXT,
    target promotional_media_target,
    banner_position promotional_media_position,
    display_order INTEGER,
    background_color TEXT,
    text_color TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    language_code TEXT,
    store_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.title,
        pm.subtitle,
        pm.description,
        pm.media_type,
        pm.image_url,
        pm.mobile_image_url,
        pm.video_url,
        pm.link_url,
        pm.button_text,
        pm.target,
        pm.banner_position,
        pm.display_order,
        pm.background_color,
        pm.text_color,
        pm.start_date,
        pm.end_date,
        pm.language_code,
        pm.store_id,
        pm.created_at
    FROM promotional_media pm
    WHERE pm.banner_position = position_param
        AND pm.is_active = true
        AND pm.language_code = language_param
        AND (pm.start_date IS NULL OR pm.start_date <= NOW())
        AND (pm.end_date IS NULL OR pm.end_date >= NOW())
    ORDER BY pm.display_order ASC, pm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get promotional media by category
CREATE OR REPLACE FUNCTION get_promotional_media_by_category(
    category_id_param UUID,
    position_param promotional_media_position DEFAULT NULL,
    language_param TEXT DEFAULT 'en'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    media_type promotional_media_type,
    image_url TEXT,
    mobile_image_url TEXT,
    video_url TEXT,
    link_url TEXT,
    button_text TEXT,
    target promotional_media_target,
    banner_position promotional_media_position,
    display_order INTEGER,
    background_color TEXT,
    text_color TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    language_code TEXT,
    store_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.title,
        pm.subtitle,
        pm.description,
        pm.media_type,
        pm.image_url,
        pm.mobile_image_url,
        pm.video_url,
        pm.link_url,
        pm.button_text,
        pm.target,
        pm.banner_position,
        pm.display_order,
        pm.background_color,
        pm.text_color,
        pm.start_date,
        pm.end_date,
        pm.language_code,
        pm.store_id,
        pm.created_at
    FROM promotional_media pm
    INNER JOIN promotional_media_categories pmc ON pm.id = pmc.promotional_media_id
    WHERE pmc.category_id = category_id_param
        AND pm.is_active = true
        AND pm.language_code = language_param
        AND (position_param IS NULL OR pm.banner_position = position_param)
        AND (pm.start_date IS NULL OR pm.start_date <= NOW())
        AND (pm.end_date IS NULL OR pm.end_date >= NOW())
    ORDER BY pm.display_order ASC, pm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE promotional_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_media_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active promotional media" ON promotional_media;
DROP POLICY IF EXISTS "Admins can manage promotional media" ON promotional_media;
DROP POLICY IF EXISTS "Public can view promotional media categories" ON promotional_media_categories;
DROP POLICY IF EXISTS "Admins can manage promotional media categories" ON promotional_media_categories;

-- Allow public read access to active promotional media
CREATE POLICY "Public can view active promotional media" ON promotional_media
    FOR SELECT USING (is_active = true);

-- Allow admins to manage promotional media
CREATE POLICY "Admins can manage promotional media" ON promotional_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Allow public read access to promotional media categories
CREATE POLICY "Public can view promotional media categories" ON promotional_media_categories
    FOR SELECT USING (true);

-- Allow admins to manage promotional media categories
CREATE POLICY "Admins can manage promotional media categories" ON promotional_media_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Insert sample promotional media data
INSERT INTO promotional_media (
    title, 
    subtitle, 
    description, 
    media_type, 
    banner_position, 
    display_order, 
    background_color, 
    text_color,
    is_active
) VALUES 
(
    'Welcome to Our Store',
    'Discover Amazing Products',
    'Shop the latest collection of premium products with free shipping on orders over $50',
    'banner',
    'homepage_top',
    1,
    '#f8fafc',
    '#1f2937',
    true
),
(
    'Summer Sale',
    'Up to 50% Off',
    'Don''t miss out on our biggest sale of the year. Limited time offer!',
    'slider',
    'homepage_top',
    2,
    '#fef3c7',
    '#92400e',
    true
),
(
    'New Arrivals',
    'Fresh Collection',
    'Check out our newest products that just arrived',
    'banner',
    'homepage_middle',
    1,
    '#ecfdf5',
    '#065f46',
    true
)
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 'promotional_media table created successfully' as status, COUNT(*) as record_count FROM promotional_media;
SELECT 'promotional_media_categories table created successfully' as status, COUNT(*) as record_count FROM promotional_media_categories;









