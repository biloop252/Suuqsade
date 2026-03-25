-- Create advertisers table for tracking advertiser entities used as admin_revenues.source_id

CREATE TABLE IF NOT EXISTS advertisers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;

-- Admin-only access (matches finance/admin patterns)
CREATE POLICY "Advertisers are viewable by admins only" ON advertisers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Advertisers are manageable by admins" ON advertisers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP TRIGGER IF EXISTS update_advertisers_updated_at ON advertisers;
CREATE TRIGGER update_advertisers_updated_at
  BEFORE UPDATE ON advertisers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

