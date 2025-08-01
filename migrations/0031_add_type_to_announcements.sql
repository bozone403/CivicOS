-- Add type column to announcements table
-- This migration adds the missing 'type' column that the schema expects

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general';

-- Update existing announcements to have the default type
UPDATE announcements SET type = 'general' WHERE type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN announcements.type IS 'Type of announcement (general, urgent, info, etc.)'; 