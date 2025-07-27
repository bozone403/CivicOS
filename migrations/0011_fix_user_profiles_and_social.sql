-- Fix user profiles and social system
-- Add missing profile fields and improve social relationships

-- Add comprehensive user profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS political_affiliation VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS education VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50) DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add profile customization fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_banner_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_accent_color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_bio_visibility VARCHAR(50) DEFAULT 'public';

-- Add social system improvements
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS mood VARCHAR(50);

-- Add user activity tracking
CREATE TABLE IF NOT EXISTS user_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add user profile views tracking
CREATE TABLE IF NOT EXISTS profile_views (
  id SERIAL PRIMARY KEY,
  viewer_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  profile_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(viewer_id, profile_id)
);

-- Add user blocks system
CREATE TABLE IF NOT EXISTS user_blocks (
  id SERIAL PRIMARY KEY,
  blocker_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Add user reports system
CREATE TABLE IF NOT EXISTS user_reports (
  id SERIAL PRIMARY KEY,
  reporter_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(100) NOT NULL,
  report_reason TEXT NOT NULL,
  evidence JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_by VARCHAR(255) REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_civic_level ON users(civic_level);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);

-- Add RLS policies for user privacy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Users can view public profiles
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (profile_visibility = 'public');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can view public posts
CREATE POLICY "Users can view public posts" ON social_posts
  FOR SELECT USING (visibility = 'public');

-- Users can create their own posts
CREATE POLICY "Users can create own posts" ON social_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON social_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON social_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Update profile completion percentage function
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completion_percentage = (
    CASE WHEN NEW.first_name IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.last_name IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.bio IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN NEW.profile_image_url IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN NEW.city IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.province IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.occupation IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN 10 ELSE 0 END +
    CASE WHEN NEW.website IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN NEW.social_links IS NOT NULL AND NEW.social_links != '{}' THEN 5 ELSE 0 END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile completion
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON users;
CREATE TRIGGER trigger_update_profile_completion
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion(); 