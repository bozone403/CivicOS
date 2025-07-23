-- Migration: Safe data migration with foreign key handling
-- Date: 2025-01-20

-- First, let's clean up orphaned data that would cause foreign key violations
DELETE FROM social_likes WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM social_comments WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM social_posts WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM user_friends WHERE user_id NOT IN (SELECT id FROM users) OR friend_id NOT IN (SELECT id FROM users);
DELETE FROM user_messages WHERE sender_id NOT IN (SELECT id FROM users) OR recipient_id NOT IN (SELECT id FROM users);

-- Now safely update the column types
ALTER TABLE users 
ALTER COLUMN location TYPE varchar,
ALTER COLUMN website TYPE varchar;

-- Add the unique constraint safely
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