-- Migration: Add social metrics to users table
-- Date: 2025-01-20
-- Description: Add follower/following counts and social metrics to users table

-- Add social metrics columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Create indexes for social metrics
CREATE INDEX IF NOT EXISTS idx_users_followers_count ON users(followers_count);
CREATE INDEX IF NOT EXISTS idx_users_following_count ON users(following_count);
CREATE INDEX IF NOT EXISTS idx_users_posts_count ON users(posts_count);

-- Add foreign key constraints to user_follows table
DO $$ 
BEGIN
    -- Add foreign key for user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_follows_user_id' 
        AND table_name = 'user_follows'
    ) THEN
        ALTER TABLE user_follows 
        ADD CONSTRAINT fk_user_follows_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for follow_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_follows_follow_id' 
        AND table_name = 'user_follows'
    ) THEN
        ALTER TABLE user_follows 
        ADD CONSTRAINT fk_user_follows_follow_id 
        FOREIGN KEY (follow_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add unique constraint to prevent duplicate follows
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_follow' 
        AND table_name = 'user_follows'
    ) THEN
        ALTER TABLE user_follows 
        ADD CONSTRAINT unique_user_follow 
        UNIQUE (user_id, follow_id);
    END IF;
END $$;

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment following count for follower
        UPDATE users 
        SET following_count = following_count + 1 
        WHERE id = NEW.user_id;
        
        -- Increment followers count for followed user
        UPDATE users 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.follow_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement following count for follower
        UPDATE users 
        SET following_count = GREATEST(following_count - 1, 0) 
        WHERE id = OLD.user_id;
        
        -- Decrement followers count for followed user
        UPDATE users 
        SET followers_count = GREATEST(followers_count - 1, 0) 
        WHERE id = OLD.follow_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic follower count updates
DROP TRIGGER IF EXISTS trigger_update_follower_counts_insert ON user_follows;
CREATE TRIGGER trigger_update_follower_counts_insert
    AFTER INSERT ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_counts();

DROP TRIGGER IF EXISTS trigger_update_follower_counts_delete ON user_follows;
CREATE TRIGGER trigger_update_follower_counts_delete
    AFTER DELETE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_counts();

-- Update existing follower counts based on current data
UPDATE users 
SET followers_count = (
    SELECT COUNT(*) 
    FROM user_follows 
    WHERE follow_id = users.id
),
following_count = (
    SELECT COUNT(*) 
    FROM user_follows 
    WHERE user_id = users.id
); 