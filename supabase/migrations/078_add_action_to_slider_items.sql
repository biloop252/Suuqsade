-- Add action_type and action_params to slider_items table
-- This allows each slider item to have its own navigation parameters

-- Add action_type and action_params columns to slider_items table
ALTER TABLE slider_items
ADD COLUMN IF NOT EXISTS action_type banner_action_type,
ADD COLUMN IF NOT EXISTS action_params JSONB DEFAULT '{}'::jsonb;

-- Create index for action_type for better query performance
CREATE INDEX IF NOT EXISTS idx_slider_items_action_type ON slider_items(action_type);

-- Add comments for documentation
COMMENT ON COLUMN slider_items.action_type IS 'Type of action to perform when slider item is clicked';
COMMENT ON COLUMN slider_items.action_params IS 'JSON parameters for the action (e.g., categoryId, productId, brand, filters, etc.)';

-- Update the get_slider_items function to include action_type and action_params
-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS get_slider_items(UUID);

CREATE FUNCTION get_slider_items(
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
  action_type banner_action_type,
  action_params JSONB,
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
    si.action_type,
    si.action_params,
    si.created_at,
    si.updated_at
  FROM slider_items si
  WHERE si.promotional_media_id = promotional_media_id_param
    AND si.is_active = true
  ORDER BY si.display_order ASC, si.created_at ASC;
END;
$$ LANGUAGE plpgsql;

