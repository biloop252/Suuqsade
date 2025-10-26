-- Add banner_url to vendor_profiles
ALTER TABLE vendor_profiles
ADD COLUMN IF NOT EXISTS banner_url TEXT;


