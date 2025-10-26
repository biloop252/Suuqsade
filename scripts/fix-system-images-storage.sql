-- Fix system-images storage bucket and policies
-- Run this in your Supabase SQL editor if the bucket creation fails

-- 1. Create storage bucket for system images (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-images', 
  'system-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload system images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view system images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update system images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete system images" ON storage.objects;

-- 3. Create storage policies for system images
CREATE POLICY "Allow authenticated users to upload system images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'system-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to view system images" ON storage.objects
FOR SELECT USING (bucket_id = 'system-images');

CREATE POLICY "Allow authenticated users to update system images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'system-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete system images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'system-images' AND 
  auth.role() = 'authenticated'
);

-- 4. Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'system-images';

-- 5. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%system%';

-- 6. Check if system_images table exists and is accessible
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_name = 'system_images' AND table_schema = 'public';

-- 7. Test insert into system_images table (optional)
-- INSERT INTO system_images (image_type, image_url, alt_text) 
-- VALUES ('logo', 'test-url', 'Test logo')
-- ON CONFLICT DO NOTHING;








