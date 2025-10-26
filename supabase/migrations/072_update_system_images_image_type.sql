-- Update system_images.image_type check constraint to include 'page'

DO $$
BEGIN
  -- Drop existing check constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'system_images_image_type_check'
      AND table_name = 'system_images'
  ) THEN
    EXECUTE 'ALTER TABLE system_images DROP CONSTRAINT system_images_image_type_check';
  END IF;

  -- Add new check constraint including the new value 'page'
  EXECUTE 'ALTER TABLE system_images 
    ADD CONSTRAINT system_images_image_type_check 
    CHECK (image_type IN (''logo'', ''favicon'', ''icon'', ''banner'', ''background'', ''page''))';
END $$;

COMMENT ON CONSTRAINT system_images_image_type_check ON system_images IS 'Allowed image types expanded to include page';


