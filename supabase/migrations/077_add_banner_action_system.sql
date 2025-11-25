-- Add dynamic banner navigation system
-- This migration adds action_type and action_params to promotional_media table

-- Create action type enum
DO $$ BEGIN
    CREATE TYPE banner_action_type AS ENUM (
        'open_category',
        'open_product',
        'open_brand',
        'open_flash_sale',
        'open_filtered_products',
        'open_url'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add action_type and action_params columns to promotional_media table
ALTER TABLE promotional_media
ADD COLUMN IF NOT EXISTS action_type banner_action_type,
ADD COLUMN IF NOT EXISTS action_params JSONB DEFAULT '{}'::jsonb;

-- Create index for action_type for better query performance
CREATE INDEX IF NOT EXISTS idx_promotional_media_action_type ON promotional_media(action_type);

-- Add comment for documentation
COMMENT ON COLUMN promotional_media.action_type IS 'Type of action to perform when banner is clicked';
COMMENT ON COLUMN promotional_media.action_params IS 'JSON parameters for the action (e.g., categoryId, productId, brand, filters, etc.)';







