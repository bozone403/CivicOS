-- Add a 'reaction' column to support emoji reactions on posts and comments
ALTER TABLE social_likes ADD COLUMN reaction VARCHAR(16) DEFAULT '👍';
-- Optionally, update existing rows to '👍' if needed
UPDATE social_likes SET reaction = '👍' WHERE reaction IS NULL; 