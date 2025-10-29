-- Manual SQL script to create homepage sections tables
-- Run this in Supabase SQL editor if migrations are not applied

DO $$ BEGIN
  CREATE TYPE homepage_section_type AS ENUM ('category','popular','trending','new_arrivals','brand','tag');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add enum values if missing (safe re-run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'homepage_section_type' AND e.enumlabel = 'best_selling'
  ) THEN
    ALTER TYPE homepage_section_type ADD VALUE 'best_selling';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'homepage_section_type' AND e.enumlabel = 'recommended'
  ) THEN
    ALTER TYPE homepage_section_type ADD VALUE 'recommended';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'homepage_section_type' AND e.enumlabel = 'flash_deals'
  ) THEN
    ALTER TYPE homepage_section_type ADD VALUE 'flash_deals';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  section_type homepage_section_type NOT NULL,
  background_image_url TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  tag_id UUID REFERENCES product_tags(id) ON DELETE SET NULL,
  product_limit INTEGER DEFAULT 12,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON homepage_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_display_order ON homepage_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_type ON homepage_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_category ON homepage_sections(category_id);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_brand ON homepage_sections(brand_id);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_tag ON homepage_sections(tag_id);

DO $$ BEGIN
  ALTER TABLE homepage_sections
    ADD CONSTRAINT chk_homepage_sections_product_limit CHECK (product_limit IS NULL OR product_limit BETWEEN 1 AND 48);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


