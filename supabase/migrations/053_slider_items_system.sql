-- Slider Items System
-- This migration creates a table for individual slider items with images and links

-- Create slider items table
CREATE TABLE slider_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotional_media_id UUID REFERENCES promotional_media(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  button_text TEXT,
  target promotional_media_target DEFAULT '_self',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_slider_items_promotional_media ON slider_items(promotional_media_id);
CREATE INDEX idx_slider_items_display_order ON slider_items(display_order);
CREATE INDEX idx_slider_items_active ON slider_items(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_slider_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_slider_items_updated_at
  BEFORE UPDATE ON slider_items
  FOR EACH ROW
  EXECUTE FUNCTION update_slider_items_updated_at();

-- Create RLS policies
ALTER TABLE slider_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active slider items
CREATE POLICY "Public can view active slider items" ON slider_items
  FOR SELECT USING (is_active = true);

-- Allow admins to manage slider items
CREATE POLICY "Admins can manage slider items" ON slider_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create function to get slider items for a promotional media
CREATE OR REPLACE FUNCTION get_slider_items(
  promotional_media_id_param UUID
)
RETURNS TABLE (
  id UUID,
  promotional_media_id UUID,
  image_url TEXT,
  mobile_image_url TEXT,
  link_url TEXT,
  button_text TEXT,
  target promotional_media_target,
  display_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.promotional_media_id,
    si.image_url,
    si.mobile_image_url,
    si.link_url,
    si.button_text,
    si.target,
    si.display_order,
    si.is_active,
    si.created_at,
    si.updated_at
  FROM slider_items si
  WHERE si.promotional_media_id = promotional_media_id_param
    AND si.is_active = true
  ORDER BY si.display_order ASC, si.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE slider_items IS 'Individual slider items with images and links for promotional media sliders';
COMMENT ON FUNCTION get_slider_items(UUID) IS 'Returns active slider items for a specific promotional media';
