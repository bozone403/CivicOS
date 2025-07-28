-- Migration: Fix data type mismatches in social tables
-- This migration fixes the post_id field types in social_shares and social_bookmarks

-- Drop existing tables if they exist
DROP TABLE IF EXISTS social_shares CASCADE;
DROP TABLE IF EXISTS social_bookmarks CASCADE;

-- Recreate social_shares table with correct data types
CREATE TABLE social_shares (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  platform VARCHAR NOT NULL,
  shared_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- Recreate social_bookmarks table with correct data types
CREATE TABLE social_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  bookmarked_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX idx_social_shares_post_id ON social_shares(post_id);
CREATE INDEX idx_social_bookmarks_user_id ON social_bookmarks(user_id);
CREATE INDEX idx_social_bookmarks_post_id ON social_bookmarks(post_id); 