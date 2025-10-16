-- Fix system-images storage policies with proper qualifications
-- This addresses the issue where INSERT policy qual is null

-- 1. First, let's see what policies currently exist
SELECT 
  'Current policies before fix' as status,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%system%'
ORDER BY policyname;

-- 2. Drop all existing system-images policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to upload system images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view system images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update system images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete system images" ON storage.objects;

-- 3. Recreate policies with explicit qualifications
-- INSERT policy with proper WITH CHECK clause
CREATE POLICY "Allow authenticated users to upload system images" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'system-images' 
  AND auth.role() = 'authenticated'
);

-- SELECT policy with proper USING clause
CREATE POLICY "Allow public access to view system images" ON storage.objects
FOR SELECT 
USING (bucket_id = 'system-images');

-- UPDATE policy with proper USING clause
CREATE POLICY "Allow authenticated users to update system images" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'system-images' 
  AND auth.role() = 'authenticated'
);

-- DELETE policy with proper USING clause
CREATE POLICY "Allow authenticated users to delete system images" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'system-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Verify the policies were created correctly
SELECT 
  'Policies after fix' as status,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%system%'
ORDER BY policyname;

-- 5. Additional check: Verify bucket exists
SELECT 
  'Bucket verification' as status,
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'system-images';

-- 6. Test policy effectiveness (this will show if policies are working)
-- Note: This is just a verification query, not an actual test
SELECT 
  'Policy verification' as status,
  COUNT(*) as policy_count,
  STRING_AGG(cmd, ', ') as commands
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%system%';


