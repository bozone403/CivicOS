-- Migration: Safe schema updates without data loss
-- Date: 2025-01-20

-- Safely update location and website columns to remove length constraints
-- This preserves all existing data
ALTER TABLE users 
ALTER COLUMN location TYPE varchar,
ALTER COLUMN website TYPE varchar;

-- Add the unique constraint for social_likes safely
-- First check if the constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'social_likes_user_id_post_id_comment_id_unique'
    ) THEN
        ALTER TABLE social_likes 
        ADD CONSTRAINT social_likes_user_id_post_id_comment_id_unique 
        UNIQUE (user_id, post_id, comment_id);
    END IF;
END $$; 