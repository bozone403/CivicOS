-- Add missing data column to notifications if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
      AND column_name = 'data'
  ) THEN
    ALTER TABLE notifications
      ADD COLUMN data jsonb;
  END IF;
END$$;

-- Add supporting columns if they are missing as well
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'source_module'
  ) THEN
    ALTER TABLE notifications ADD COLUMN source_module varchar;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN source_id varchar;
  END IF;
END$$;

