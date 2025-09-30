-- Create storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-documents', 'vendor-documents', true);

-- Create RLS policies for vendor documents bucket
CREATE POLICY "Vendor documents are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-documents');

CREATE POLICY "Vendor documents are insertable by authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vendor-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Vendor documents are updatable by authenticated users" ON storage.objects
  FOR UPDATE USING (bucket_id = 'vendor-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Vendor documents are deletable by authenticated users" ON storage.objects
  FOR DELETE USING (bucket_id = 'vendor-documents' AND auth.role() = 'authenticated');



