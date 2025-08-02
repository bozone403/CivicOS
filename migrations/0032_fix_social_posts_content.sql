-- Fix social_posts content field to be NOT NULL
-- This migration ensures the content field is required as expected by the application

-- Update existing NULL content to a default value
UPDATE social_posts SET content = '[Empty post]' WHERE content IS NULL;

-- Alter the column to be NOT NULL
ALTER TABLE social_posts ALTER COLUMN content SET NOT NULL; 