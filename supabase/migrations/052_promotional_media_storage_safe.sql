-- Setup storage bucket for promotional media files (Safe Version)
-- This migration creates a storage bucket for promotional media uploads

-- Check if bucket exists and create if it doesn't
DO $$
BEGIN
  -- Create storage bucket for promotional media
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'promotional-media') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'promotional-media',
      'promotional-media',
      true,
      10485760, -- 10MB limit
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
    );
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view promotional media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload promotional media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update promotional media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete promotional media files" ON storage.objects;

-- Create storage policies for promotional media bucket
CREATE POLICY "Public can view promotional media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'promotional-media');

CREATE POLICY "Admins can upload promotional media files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promotional-media' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update promotional media files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promotional-media' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete promotional media files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promotional-media' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Public can view promotional media files" ON storage.objects IS 'Allows public access to view promotional media files';
COMMENT ON POLICY "Admins can upload promotional media files" ON storage.objects IS 'Allows admins to upload promotional media files';
COMMENT ON POLICY "Admins can update promotional media files" ON storage.objects IS 'Allows admins to update promotional media files';
COMMENT ON POLICY "Admins can delete promotional media files" ON storage.objects IS 'Allows admins to delete promotional media files';









