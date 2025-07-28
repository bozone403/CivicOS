-- Migration: Add username field to users table
-- This migration adds a unique username field for user profiles

-- Add username column
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_users_username ON users(username);

-- Update existing users with usernames based on email
UPDATE users 
SET username = CASE 
  WHEN email IS NOT NULL THEN 
    LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'))
  ELSE 
    'user_' || id
END
WHERE username IS NULL;

-- Ensure all users have a username
UPDATE users 
SET username = 'user_' || id 
WHERE username IS NULL OR username = '';

-- Add NOT NULL constraint after populating data
ALTER TABLE users ALTER COLUMN username SET NOT NULL; 