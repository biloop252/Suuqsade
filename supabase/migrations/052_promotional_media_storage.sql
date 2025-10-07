-- Simplified promotional media storage setup
-- This version avoids direct policy creation on storage.objects

-- Create storage bucket for promotional media (only if it doesn't exist)
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

-- Note: Storage policies will be created through Supabase Dashboard
-- Go to Storage > Policies and create the following policies manually:
-- 
-- 1. Public can view promotional media files:
--    - Operation: SELECT
--    - Target roles: public
--    - USING expression: bucket_id = 'promotional-media'
--
-- 2. Admins can upload promotional media files:
--    - Operation: INSERT
--    - Target roles: authenticated
--    - WITH CHECK expression: bucket_id = 'promotional-media' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
--
-- 3. Admins can update promotional media files:
--    - Operation: UPDATE
--    - Target roles: authenticated
--    - USING expression: bucket_id = 'promotional-media' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
--
-- 4. Admins can delete promotional media files:
--    - Operation: DELETE
--    - Target roles: authenticated
--    - USING expression: bucket_id = 'promotional-media' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))

-- Verify bucket was created
SELECT 'Storage bucket created successfully' as status, * FROM storage.buckets WHERE id = 'promotional-media';
