-- Product tags tables
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_tag_assignments (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES product_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_product_id ON product_tag_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_tag_id ON product_tag_assignments(tag_id);

-- Enable RLS
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, admin manage)
-- product_tags
DROP POLICY IF EXISTS "Product tags are viewable by everyone" ON product_tags;
CREATE POLICY "Product tags are viewable by everyone" ON product_tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage product tags" ON product_tags;
CREATE POLICY "Only admins can manage product tags" ON product_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.role IN ('admin','super_admin','staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.role IN ('admin','super_admin','staff')
    )
  );

-- product_tag_assignments
DROP POLICY IF EXISTS "Product tag assignments are viewable by everyone" ON product_tag_assignments;
CREATE POLICY "Product tag assignments are viewable by everyone" ON product_tag_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage product tag assignments" ON product_tag_assignments;
CREATE POLICY "Only admins can manage product tag assignments" ON product_tag_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.role IN ('admin','super_admin','staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
        AND p.role IN ('admin','super_admin','staff')
    )
  );

-- Helper trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_tags_updated_at ON product_tags;
CREATE TRIGGER trg_product_tags_updated_at
BEFORE UPDATE ON product_tags
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();


