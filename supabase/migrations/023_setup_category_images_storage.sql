-- Create storage bucket for category images
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true);

-- Create policy to allow authenticated users to upload category images
CREATE POLICY "Allow authenticated users to upload category images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'category-images' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow public access to view category images
CREATE POLICY "Allow public access to view category images" ON storage.objects
FOR SELECT USING (bucket_id = 'category-images');

-- Create policy to allow authenticated users to update category images
CREATE POLICY "Allow authenticated users to update category images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'category-images' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete category images
CREATE POLICY "Allow authenticated users to delete category images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'category-images' AND 
  auth.role() = 'authenticated'
);





