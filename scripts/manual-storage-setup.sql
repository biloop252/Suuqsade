-- Manual SQL script for promotional media storage setup
-- Run this directly in your Supabase SQL editor if migration fails

-- 1. Create storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'promotional-media',
  'promotional-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'promotional-media'
);

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Public can view promotional media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload promotional media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update promotional media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete promotional media files" ON storage.objects;

-- 3. Create storage policies
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

-- 4. Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'promotional-media';

-- 5. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%promotional%';





