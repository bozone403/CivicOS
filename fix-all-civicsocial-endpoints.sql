-- COMPREHENSIVE CIVICSOCIAL DATABASE FIXES
-- This script creates all missing tables and fixes for CivicSocial functionality

-- 1. FIX SOCIAL LIKES TABLE
CREATE TABLE IF NOT EXISTS "social_likes" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" UUID NOT NULL,
  "reaction" VARCHAR(10) DEFAULT '👍',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. FIX SOCIAL COMMENTS TABLE
CREATE TABLE IF NOT EXISTS "social_comments" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE MESSAGING SYSTEM TABLES
CREATE TABLE IF NOT EXISTS "social_conversations" (
  "id" SERIAL PRIMARY KEY,
  "user1_id" UUID NOT NULL,
  "user2_id" UUID NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("user1_id", "user2_id")
);

CREATE TABLE IF NOT EXISTS "social_messages" (
  "id" SERIAL PRIMARY KEY,
  "conversation_id" INTEGER NOT NULL,
  "sender_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE FRIENDS SYSTEM TABLES
CREATE TABLE IF NOT EXISTS "social_friends" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "friend_id" UUID NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("user_id", "friend_id")
);

-- 5. CREATE NOTIFICATIONS SYSTEM
CREATE TABLE IF NOT EXISTS "social_notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "is_read" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE ACTIVITY TRACKING
CREATE TABLE IF NOT EXISTS "social_activities" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "target_id" INTEGER,
  "target_type" VARCHAR(50),
  "data" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. CREATE BOOKMARKS SYSTEM
CREATE TABLE IF NOT EXISTS "social_bookmarks" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "post_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("user_id", "post_id")
);

-- 8. CREATE SHARES SYSTEM
CREATE TABLE IF NOT EXISTS "social_shares" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "post_id" INTEGER NOT NULL,
  "platform" VARCHAR(50),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. CREATE USER STATS TABLE
CREATE TABLE IF NOT EXISTS "social_user_stats" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL UNIQUE,
  "posts_count" INTEGER DEFAULT 0,
  "comments_count" INTEGER DEFAULT 0,
  "likes_received" INTEGER DEFAULT 0,
  "likes_given" INTEGER DEFAULT 0,
  "friends_count" INTEGER DEFAULT 0,
  "followers_count" INTEGER DEFAULT 0,
  "following_count" INTEGER DEFAULT 0,
  "bookmarks_count" INTEGER DEFAULT 0,
  "shares_count" INTEGER DEFAULT 0,
  "last_activity" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. CREATE FOLLOW SYSTEM
CREATE TABLE IF NOT EXISTS "social_follows" (
  "id" SERIAL PRIMARY KEY,
  "follower_id" UUID NOT NULL,
  "following_id" UUID NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("follower_id", "following_id")
);

-- 11. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS "idx_social_likes_post_id" ON "social_likes" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_social_likes_user_id" ON "social_likes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_comments_post_id" ON "social_comments" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_social_comments_user_id" ON "social_comments" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_messages_conversation_id" ON "social_messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_social_messages_sender_id" ON "social_messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "idx_social_messages_recipient_id" ON "social_messages" ("recipient_id");
CREATE INDEX IF NOT EXISTS "idx_social_friends_user_id" ON "social_friends" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_friends_friend_id" ON "social_friends" ("friend_id");
CREATE INDEX IF NOT EXISTS "idx_social_notifications_user_id" ON "social_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_activities_user_id" ON "social_activities" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_bookmarks_user_id" ON "social_bookmarks" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_shares_user_id" ON "social_shares" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_follows_follower_id" ON "social_follows" ("follower_id");
CREATE INDEX IF NOT EXISTS "idx_social_follows_following_id" ON "social_follows" ("following_id");

-- 12. ADD FOREIGN KEY CONSTRAINTS
ALTER TABLE "social_likes" ADD CONSTRAINT IF NOT EXISTS "fk_social_likes_post_id" 
  FOREIGN KEY ("post_id") REFERENCES "social_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "social_likes" ADD CONSTRAINT IF NOT EXISTS "fk_social_likes_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_comments" ADD CONSTRAINT IF NOT EXISTS "fk_social_comments_post_id" 
  FOREIGN KEY ("post_id") REFERENCES "social_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "social_comments" ADD CONSTRAINT IF NOT EXISTS "fk_social_comments_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_conversations" ADD CONSTRAINT IF NOT EXISTS "fk_social_conversations_user1_id" 
  FOREIGN KEY ("user1_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "social_conversations" ADD CONSTRAINT IF NOT EXISTS "fk_social_conversations_user2_id" 
  FOREIGN KEY ("user2_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_messages" ADD CONSTRAINT IF NOT EXISTS "fk_social_messages_conversation_id" 
  FOREIGN KEY ("conversation_id") REFERENCES "social_conversations" ("id") ON DELETE CASCADE;
ALTER TABLE "social_messages" ADD CONSTRAINT IF NOT EXISTS "fk_social_messages_sender_id" 
  FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "social_messages" ADD CONSTRAINT IF NOT EXISTS "fk_social_messages_recipient_id" 
  FOREIGN KEY ("recipient_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_friends" ADD CONSTRAINT IF NOT EXISTS "fk_social_friends_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "social_friends" ADD CONSTRAINT IF NOT EXISTS "fk_social_friends_friend_id" 
  FOREIGN KEY ("friend_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_notifications" ADD CONSTRAINT IF NOT EXISTS "fk_social_notifications_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_activities" ADD CONSTRAINT IF NOT EXISTS "fk_social_activities_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_bookmarks" ADD CONSTRAINT IF NOT EXISTS "fk_social_bookmarks_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "social_bookmarks" ADD CONSTRAINT IF NOT EXISTS "fk_social_bookmarks_post_id" 
  FOREIGN KEY ("post_id") REFERENCES "social_posts" ("id") ON DELETE CASCADE;

ALTER TABLE "social_shares" ADD CONSTRAINT IF NOT EXISTS "fk_social_shares_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "social_shares" ADD CONSTRAINT IF NOT EXISTS "fk_social_shares_post_id" 
  FOREIGN KEY ("post_id") REFERENCES "social_posts" ("id") ON DELETE CASCADE;

ALTER TABLE "social_user_stats" ADD CONSTRAINT IF NOT EXISTS "fk_social_user_stats_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "social_follows" ADD CONSTRAINT IF NOT EXISTS "fk_social_follows_follower_id" 
  FOREIGN KEY ("follower_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "social_follows" ADD CONSTRAINT IF NOT EXISTS "fk_social_follows_following_id" 
  FOREIGN KEY ("following_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- 13. INSERT DEFAULT DATA
INSERT INTO "social_user_stats" ("user_id", "posts_count", "comments_count", "likes_received", "likes_given", "friends_count", "followers_count", "following_count", "bookmarks_count", "shares_count")
SELECT 
  u.id,
  0, 0, 0, 0, 0, 0, 0, 0, 0
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1 FROM "social_user_stats" s WHERE s.user_id = u.id
);

-- 14. VERIFY ALL TABLES EXIST
DO $$
DECLARE
  table_name text;
  expected_tables text[] := ARRAY[
    'social_likes',
    'social_comments', 
    'social_conversations',
    'social_messages',
    'social_friends',
    'social_notifications',
    'social_activities',
    'social_bookmarks',
    'social_shares',
    'social_user_stats',
    'social_follows'
  ];
BEGIN
  FOREACH table_name IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name) THEN
      RAISE EXCEPTION 'Table % does not exist', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'All CivicSocial tables created successfully!';
END $$;

-- 15. FINAL VERIFICATION
SELECT 'CivicSocial database fixes completed successfully' as status; 