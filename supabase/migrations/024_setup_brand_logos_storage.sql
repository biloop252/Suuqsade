-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true);

-- Create policy to allow authenticated users to upload brand logos
CREATE POLICY "Allow authenticated users to upload brand logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'brand-logos' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow public access to view brand logos
CREATE POLICY "Allow public access to view brand logos" ON storage.objects
FOR SELECT USING (bucket_id = 'brand-logos');

-- Create policy to allow authenticated users to update brand logos
CREATE POLICY "Allow authenticated users to update brand logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'brand-logos' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete brand logos
CREATE POLICY "Allow authenticated users to delete brand logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'brand-logos' AND 
  auth.role() = 'authenticated'
);





