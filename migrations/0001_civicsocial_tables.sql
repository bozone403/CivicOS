-- CivicSocial Database Migration
-- This creates all the necessary tables for the CivicSocial platform

-- Social Posts Table
CREATE TABLE IF NOT EXISTS social_posts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    image_url VARCHAR,
    type VARCHAR DEFAULT 'post' CHECK (type IN ('post', 'share', 'poll', 'event')),
    original_item_id INTEGER,
    original_item_type VARCHAR,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Comments Table
CREATE TABLE IF NOT EXISTS social_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES social_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Likes Table
CREATE TABLE IF NOT EXISTS social_likes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES social_posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES social_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    -- Ensure either post_id or comment_id is set, but not both
    CONSTRAINT check_like_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- User Friends Table
CREATE TABLE IF NOT EXISTS user_friends (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Prevent duplicate friend relationships
    UNIQUE(user_id, friend_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(type);

CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_user_id ON social_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_parent_id ON social_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_social_likes_user_id ON social_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_comment_id ON social_likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- Add some sample data for testing
INSERT INTO social_posts (user_id, content, type) VALUES 
('demo_user', 'Welcome to CivicSocial! This is where citizens can share their thoughts on democracy and civic engagement.', 'post'),
('demo_user', 'Just voted on Bill C-123. What do you think about this new legislation?', 'post'),
('demo_user', 'Attending the town hall meeting tonight. Anyone else going?', 'post')
ON CONFLICT DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_comments_updated_at BEFORE UPDATE ON social_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_friends_updated_at BEFORE UPDATE ON user_friends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 