-- Migration: Add profile customization fields
-- This migration adds comprehensive profile customization options

-- Add profile customization fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_accent_color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_banner_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_bio_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_location_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_stats_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_posts_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_custom_fields JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_layout VARCHAR(20) DEFAULT 'standard';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_show_badges BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_show_stats BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_show_activity BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_show_friends BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_show_posts BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_last_updated TIMESTAMP;

-- Add social media and interest fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS political_affiliation VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS education VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS political_interests TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS civic_interests TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_theme ON users(profile_theme);
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_users_political_affiliation ON users(political_affiliation); 