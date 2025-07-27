-- CivicSocial Complete Schema Migration
-- This migration creates all necessary tables for the CivicSocial functionality

-- Create social_posts table
CREATE TABLE IF NOT EXISTS "social_posts" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "content" text,
  "image_url" varchar,
  "type" varchar DEFAULT 'post',
  "original_item_id" integer,
  "original_item_type" varchar,
  "comment" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "visibility" varchar DEFAULT 'public',
  "tags" text[],
  "location" varchar,
  "mood" varchar
);

-- Create social_comments table
CREATE TABLE IF NOT EXISTS "social_comments" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "parent_comment_id" integer REFERENCES "social_comments"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create social_likes table
CREATE TABLE IF NOT EXISTS "social_likes" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "post_id" integer REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "comment_id" integer REFERENCES "social_comments"("id") ON DELETE CASCADE,
  "reaction" varchar(16) DEFAULT '👍',
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_like" UNIQUE("user_id", "post_id", "comment_id")
);

-- Create social_shares table
CREATE TABLE IF NOT EXISTS "social_shares" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "post_id" integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "shared_post_id" integer REFERENCES "social_posts"("id"),
  "share_type" varchar DEFAULT 'repost',
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_share" UNIQUE("user_id", "post_id")
);

-- Create social_bookmarks table
CREATE TABLE IF NOT EXISTS "social_bookmarks" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "post_id" integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_bookmark" UNIQUE("user_id", "post_id")
);

-- Create user_friends table
CREATE TABLE IF NOT EXISTS "user_friends" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "friend_id" varchar NOT NULL REFERENCES "users"("id"),
  "status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_friendship" UNIQUE("user_id", "friend_id")
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS "user_activities" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "activity_type" varchar NOT NULL,
  "activity_data" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS "profile_views" (
  "id" serial PRIMARY KEY,
  "viewer_id" varchar REFERENCES "users"("id"),
  "profile_id" varchar NOT NULL REFERENCES "users"("id"),
  "viewed_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_view" UNIQUE("viewer_id", "profile_id")
);

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS "user_blocks" (
  "id" serial PRIMARY KEY,
  "blocker_id" varchar NOT NULL REFERENCES "users"("id"),
  "blocked_id" varchar NOT NULL REFERENCES "users"("id"),
  "reason" text,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_block" UNIQUE("blocker_id", "blocked_id")
);

-- Create user_reports table
CREATE TABLE IF NOT EXISTS "user_reports" (
  "id" serial PRIMARY KEY,
  "reporter_id" varchar NOT NULL REFERENCES "users"("id"),
  "reported_id" varchar NOT NULL REFERENCES "users"("id"),
  "report_type" varchar NOT NULL,
  "report_reason" text NOT NULL,
  "evidence" jsonb,
  "status" varchar DEFAULT 'pending',
  "reviewed_by" varchar REFERENCES "users"("id"),
  "reviewed_at" timestamp
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_social_posts_user_id" ON "social_posts"("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_posts_created_at" ON "social_posts"("created_at");
CREATE INDEX IF NOT EXISTS "idx_social_posts_visibility" ON "social_posts"("visibility");
CREATE INDEX IF NOT EXISTS "idx_social_comments_post_id" ON "social_comments"("post_id");
CREATE INDEX IF NOT EXISTS "idx_social_likes_post_id" ON "social_likes"("post_id");
CREATE INDEX IF NOT EXISTS "idx_social_likes_user_id" ON "social_likes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_shares_post_id" ON "social_shares"("post_id");
CREATE INDEX IF NOT EXISTS "idx_social_bookmarks_user_id" ON "social_bookmarks"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_friends_user_id" ON "user_friends"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_friends_status" ON "user_friends"("status");
CREATE INDEX IF NOT EXISTS "idx_user_activities_user_id" ON "user_activities"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_activities_type" ON "user_activities"("activity_type");

-- Add RLS (Row Level Security) policies
ALTER TABLE "social_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_friends" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profile_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_reports" ENABLE ROW LEVEL SECURITY;

-- Social posts policies
CREATE POLICY "social_posts_select_policy" ON "social_posts" FOR SELECT USING (
  visibility = 'public' OR 
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_friends 
    WHERE (user_id = auth.uid() AND friend_id = social_posts.user_id AND status = 'accepted')
    OR (friend_id = auth.uid() AND user_id = social_posts.user_id AND status = 'accepted')
  )
);

CREATE POLICY "social_posts_insert_policy" ON "social_posts" FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "social_posts_update_policy" ON "social_posts" FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "social_posts_delete_policy" ON "social_posts" FOR DELETE USING (user_id = auth.uid());

-- Social comments policies
CREATE POLICY "social_comments_select_policy" ON "social_comments" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM social_posts 
    WHERE social_posts.id = social_comments.post_id 
    AND (social_posts.visibility = 'public' OR social_posts.user_id = auth.uid())
  )
);

CREATE POLICY "social_comments_insert_policy" ON "social_comments" FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "social_comments_update_policy" ON "social_comments" FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "social_comments_delete_policy" ON "social_comments" FOR DELETE USING (user_id = auth.uid());

-- Social likes policies
CREATE POLICY "social_likes_select_policy" ON "social_likes" FOR SELECT USING (true);

CREATE POLICY "social_likes_insert_policy" ON "social_likes" FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "social_likes_delete_policy" ON "social_likes" FOR DELETE USING (user_id = auth.uid());

-- User friends policies
CREATE POLICY "user_friends_select_policy" ON "user_friends" FOR SELECT USING (
  user_id = auth.uid() OR friend_id = auth.uid()
);

CREATE POLICY "user_friends_insert_policy" ON "user_friends" FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_friends_update_policy" ON "user_friends" FOR UPDATE USING (
  user_id = auth.uid() OR friend_id = auth.uid()
);

CREATE POLICY "user_friends_delete_policy" ON "user_friends" FOR DELETE USING (
  user_id = auth.uid() OR friend_id = auth.uid()
);

-- User activities policies
CREATE POLICY "user_activities_select_policy" ON "user_activities" FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_activities_insert_policy" ON "user_activities" FOR INSERT WITH CHECK (user_id = auth.uid());

-- Profile views policies
CREATE POLICY "profile_views_select_policy" ON "profile_views" FOR SELECT USING (
  viewer_id = auth.uid() OR profile_id = auth.uid()
);

CREATE POLICY "profile_views_insert_policy" ON "profile_views" FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- User blocks policies
CREATE POLICY "user_blocks_select_policy" ON "user_blocks" FOR SELECT USING (
  blocker_id = auth.uid() OR blocked_id = auth.uid()
);

CREATE POLICY "user_blocks_insert_policy" ON "user_blocks" FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "user_blocks_delete_policy" ON "user_blocks" FOR DELETE USING (blocker_id = auth.uid());

-- User reports policies
CREATE POLICY "user_reports_select_policy" ON "user_reports" FOR SELECT USING (
  reporter_id = auth.uid() OR reported_id = auth.uid()
);

CREATE POLICY "user_reports_insert_policy" ON "user_reports" FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Insert some sample data for testing
INSERT INTO "social_posts" ("user_id", "content", "type", "visibility", "tags", "location", "mood") VALUES
('test-user-1', 'Just attended a local town hall meeting. Great to see civic engagement in action!', 'post', 'public', ARRAY['civic engagement', 'town hall'], 'Toronto, ON', 'excited'),
('test-user-2', 'Reading about the new bill C-18. What are your thoughts on digital news regulation?', 'post', 'public', ARRAY['bill C-18', 'digital news', 'regulation'], 'Vancouver, BC', 'curious'),
('test-user-3', 'Volunteered at the local food bank today. Small actions can make a big difference in our community.', 'post', 'public', ARRAY['volunteering', 'community', 'food bank'], 'Montreal, QC', 'fulfilled')
ON CONFLICT DO NOTHING; 