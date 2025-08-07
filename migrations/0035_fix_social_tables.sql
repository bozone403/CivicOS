-- Fix Social Tables Migration
-- This migration ensures all social tables exist and have proper structure

-- Create social_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  type VARCHAR DEFAULT 'post',
  original_item_id INTEGER,
  original_item_type VARCHAR,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  visibility VARCHAR DEFAULT 'public',
  tags TEXT[],
  location VARCHAR,
  mood VARCHAR
);

-- Create social_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_comments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create social_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_likes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  reaction VARCHAR DEFAULT 'like',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create social_shares table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_shares (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  platform VARCHAR NOT NULL,
  shared_at TIMESTAMP DEFAULT NOW()
);

-- Create social_bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  bookmarked_at TIMESTAMP DEFAULT NOW()
);

-- Create user_friends table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_friends (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  friend_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_messages (
  id SERIAL PRIMARY KEY,
  sender_id VARCHAR NOT NULL,
  recipient_id VARCHAR NOT NULL,
  subject VARCHAR,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  description TEXT,
  data JSONB,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  source_module VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  source_id VARCHAR
);

-- Create user_follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_follows (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  follow_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
  ALTER TABLE social_posts ADD CONSTRAINT fk_social_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_comments ADD CONSTRAINT fk_social_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_comments ADD CONSTRAINT fk_social_comments_post_id FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_likes ADD CONSTRAINT fk_social_likes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_likes ADD CONSTRAINT fk_social_likes_post_id FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_shares ADD CONSTRAINT fk_social_shares_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_shares ADD CONSTRAINT fk_social_shares_post_id FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_bookmarks ADD CONSTRAINT fk_social_bookmarks_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_bookmarks ADD CONSTRAINT fk_social_bookmarks_post_id FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_friends ADD CONSTRAINT fk_user_friends_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_friends ADD CONSTRAINT fk_user_friends_friend_id FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_messages ADD CONSTRAINT fk_user_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_messages ADD CONSTRAINT fk_user_messages_recipient_id FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_activities ADD CONSTRAINT fk_user_activities_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_follows ADD CONSTRAINT fk_user_follows_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_follows ADD CONSTRAINT fk_user_follows_follow_id FOREIGN KEY (follow_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add unique constraints
DO $$ BEGIN
  ALTER TABLE user_friends ADD CONSTRAINT unique_user_friend UNIQUE (user_id, friend_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_follows ADD CONSTRAINT unique_user_follow UNIQUE (user_id, follow_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_likes ADD CONSTRAINT unique_user_post_like UNIQUE (user_id, post_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE social_bookmarks ADD CONSTRAINT unique_user_post_bookmark UNIQUE (user_id, post_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON social_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);
CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follow_id ON user_follows(follow_id);

-- Insert some sample data for testing
INSERT INTO social_posts (user_id, content, visibility) VALUES 
  ('19be0f7d-eebc-4a00-8bbe-eff58f95249a', 'Welcome to CivicOS! This is my first post.', 'public')
ON CONFLICT DO NOTHING;

-- Update user social metrics
UPDATE users SET 
  posts_count = (SELECT COUNT(*) FROM social_posts WHERE user_id = users.id),
  followers_count = (SELECT COUNT(*) FROM user_follows WHERE follow_id = users.id),
  following_count = (SELECT COUNT(*) FROM user_follows WHERE user_id = users.id)
WHERE id = '19be0f7d-eebc-4a00-8bbe-eff58f95249a'; 