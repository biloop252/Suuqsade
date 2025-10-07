-- Add homepage_middle_slider position to promotional media positions enum
-- This migration adds the new position for homepage middle slider section

-- Add the new position to the enum
ALTER TYPE promotional_media_position ADD VALUE IF NOT EXISTS 'homepage_middle_slider';

-- Add comment for documentation
COMMENT ON TYPE promotional_media_position IS 'Positions where promotional media can be displayed: homepage_top, homepage_middle, homepage_bottom, homepage_middle_slider, category_page, product_page, sidebar, footer, popup, header, checkout_page, cart_page, limited_time_deals';
