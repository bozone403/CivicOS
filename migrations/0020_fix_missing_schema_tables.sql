-- Migration: Fix missing schema tables and fields
-- This migration adds all missing tables and fields referenced in the codebase

-- Create socialShares table
CREATE TABLE IF NOT EXISTS social_shares (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  platform VARCHAR NOT NULL,
  shared_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- Create socialBookmarks table
CREATE TABLE IF NOT EXISTS social_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  bookmarked_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- Create userNotificationPreferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notification_types JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add missing fields to social_posts table
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS reaction VARCHAR DEFAULT 'like',
ADD COLUMN IF NOT EXISTS source_id VARCHAR,
ADD COLUMN IF NOT EXISTS date_created TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderated_by VARCHAR,
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Add missing fields to social_likes table
ALTER TABLE social_likes 
ADD COLUMN IF NOT EXISTS reaction VARCHAR DEFAULT 'like',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Add missing fields to social_comments table
ALTER TABLE social_comments 
ADD COLUMN IF NOT EXISTS parent_id INTEGER,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderated_by VARCHAR;

-- Add missing fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR DEFAULT 'public',
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_method VARCHAR,
ADD COLUMN IF NOT EXISTS account_status VARCHAR DEFAULT 'active',
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Add missing fields to politicians table
ALTER TABLE politicians 
ADD COLUMN IF NOT EXISTS party_affiliation VARCHAR,
ADD COLUMN IF NOT EXISTS constituency VARCHAR,
ADD COLUMN IF NOT EXISTS election_date DATE,
ADD COLUMN IF NOT EXISTS term_start DATE,
ADD COLUMN IF NOT EXISTS term_end DATE,
ADD COLUMN IF NOT EXISTS is_incumbent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS biography TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS voting_record JSONB DEFAULT '{}';

-- Add missing fields to bills table
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS sponsor_id VARCHAR,
ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR,
ADD COLUMN IF NOT EXISTS bill_type VARCHAR,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'introduced',
ADD COLUMN IF NOT EXISTS introduced_date DATE,
ADD COLUMN IF NOT EXISTS passed_date DATE,
ADD COLUMN IF NOT EXISTS enacted_date DATE,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS full_text TEXT,
ADD COLUMN IF NOT EXISTS committee_referral VARCHAR,
ADD COLUMN IF NOT EXISTS fiscal_impact TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_post_id ON social_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_social_bookmarks_user_id ON social_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_social_bookmarks_post_id ON social_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_reaction ON social_posts(reaction);
CREATE INDEX IF NOT EXISTS idx_social_posts_moderation_status ON social_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_social_likes_reaction ON social_likes(reaction);
CREATE INDEX IF NOT EXISTS idx_social_comments_parent_id ON social_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_politicians_party_affiliation ON politicians(party_affiliation);
CREATE INDEX IF NOT EXISTS idx_bills_sponsor_id ON bills(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status); 