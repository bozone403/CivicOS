-- Add usernames to existing users
-- This migration ensures all users have usernames for profile access

-- Update existing users to have usernames based on their email or ID
UPDATE users 
SET username = CASE 
  WHEN email IS NOT NULL THEN 
    LOWER(REPLACE(REPLACE(REPLACE(email, '@', '_'), '.', '_'), '-', '_')
  ELSE 
    'user_' || SUBSTRING(id, 1, 8)
  END
WHERE username IS NULL OR username = '';

-- Ensure usernames are unique by adding a suffix if needed
UPDATE users 
SET username = username || '_' || SUBSTRING(id, 9, 4)
WHERE id IN (
  SELECT u1.id 
  FROM users u1 
  JOIN users u2 ON u1.username = u2.username AND u1.id != u2.id
);

-- Set a default username for any remaining users without usernames
UPDATE users 
SET username = 'user_' || SUBSTRING(id, 1, 12)
WHERE username IS NULL OR username = ''; 