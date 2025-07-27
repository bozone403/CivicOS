-- Migration to add missing columns and tables for dashboard functionality
-- This migration adds the required fields for the enhanced user profiles and social features

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS political_affiliation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS education VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50) DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_banner_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_accent_color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_bio_visibility VARCHAR(50) DEFAULT 'public';

-- Add missing columns to social_posts table
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS mood VARCHAR(100);

-- Create user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create profile_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS profile_views (
    id SERIAL PRIMARY KEY,
    viewer_id VARCHAR(255) REFERENCES users(id),
    profile_id VARCHAR(255) NOT NULL REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT profile_views_viewer_id_profile_id_unique UNIQUE(viewer_id, profile_id)
);

-- Create user_blocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id VARCHAR(255) NOT NULL REFERENCES users(id),
    blocked_id VARCHAR(255) NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT user_blocks_blocker_id_blocked_id_unique UNIQUE(blocker_id, blocked_id)
);

-- Create user_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_reports (
    id SERIAL PRIMARY KEY,
    reporter_id VARCHAR(255) NOT NULL REFERENCES users(id),
    reported_id VARCHAR(255) NOT NULL REFERENCES users(id),
    report_type VARCHAR(100) NOT NULL,
    report_reason TEXT NOT NULL,
    evidence JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by VARCHAR(255) REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_id ON user_reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create RLS policies for profile_views
CREATE POLICY "Anyone can view profile views" ON profile_views
    FOR SELECT USING (true);

CREATE POLICY "Users can insert profile views" ON profile_views
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for user_blocks
CREATE POLICY "Users can view their own blocks" ON user_blocks
    FOR SELECT USING (auth.uid()::text = blocker_id OR auth.uid()::text = blocked_id);

CREATE POLICY "Users can insert their own blocks" ON user_blocks
    FOR INSERT WITH CHECK (auth.uid()::text = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON user_blocks
    FOR DELETE USING (auth.uid()::text = blocker_id);

-- Create RLS policies for user_reports
CREATE POLICY "Users can view their own reports" ON user_reports
    FOR SELECT USING (auth.uid()::text = reporter_id);

CREATE POLICY "Users can insert their own reports" ON user_reports
    FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

-- Create function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate completion percentage based on filled fields
    NEW.profile_completion_percentage = (
        CASE WHEN NEW.first_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.last_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.email IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.bio IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN NEW.occupation IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.education IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.political_affiliation IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN 15 ELSE 0 END +
        CASE WHEN NEW.profile_image_url IS NOT NULL THEN 10 ELSE 0 END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile completion
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON users;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Update existing users to have proper profile completion
UPDATE users SET profile_completion_percentage = (
    CASE WHEN first_name IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN last_name IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN email IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN bio IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN occupation IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN education IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN political_affiliation IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN interests IS NOT NULL AND array_length(interests, 1) > 0 THEN 15 ELSE 0 END +
    CASE WHEN profile_image_url IS NOT NULL THEN 10 ELSE 0 END
);

-- Add some sample data for testing
INSERT INTO user_activities (user_id, activity_type, activity_data, created_at)
VALUES 
    ('test-user-1', 'profile_update', '{"field": "bio", "value": "Updated bio"}', NOW() - INTERVAL '1 day'),
    ('test-user-1', 'vote', '{"bill_id": 1, "vote_type": "yes"}', NOW() - INTERVAL '2 hours'),
    ('test-user-1', 'social_post', '{"post_id": 1, "content": "Test post"}', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Add sample profile view
INSERT INTO profile_views (viewer_id, profile_id, viewed_at)
VALUES ('test-user-1', 'test-user-1', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING; 