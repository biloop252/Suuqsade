-- Extend homepage_section_type enum with additional values
DO $$ BEGIN
  ALTER TYPE homepage_section_type ADD VALUE IF NOT EXISTS 'best_selling';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE homepage_section_type ADD VALUE IF NOT EXISTS 'recommended';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE homepage_section_type ADD VALUE IF NOT EXISTS 'flash_deals';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


