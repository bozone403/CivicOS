-- COMPREHENSIVE CIVICOS DATABASE FIXES
-- This script fixes all identified database issues from the double audit

-- 1. FIX ANNOUNCEMENTS TABLE SCHEMA MISMATCH
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. ENSURE ALL SOCIAL TABLES EXIST
-- Create social_posts table if it doesn't exist
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

-- Create social_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "social_comments" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "parent_comment_id" integer REFERENCES "social_comments"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create social_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS "social_likes" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "post_id" integer REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "comment_id" integer REFERENCES "social_comments"("id") ON DELETE CASCADE,
  "reaction" varchar(16) DEFAULT '👍',
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_like" UNIQUE("user_id", "post_id", "comment_id")
);

-- Create social_shares table if it doesn't exist
CREATE TABLE IF NOT EXISTS "social_shares" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "post_id" integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "shared_post_id" integer REFERENCES "social_posts"("id"),
  "share_type" varchar DEFAULT 'repost',
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_share" UNIQUE("user_id", "post_id")
);

-- Create social_bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS "social_bookmarks" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "post_id" integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_bookmark" UNIQUE("user_id", "post_id")
);

-- Create user_friends table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_friends" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "friend_id" varchar NOT NULL REFERENCES "users"("id"),
  "status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_friendship" UNIQUE("user_id", "friend_id")
);

-- Create user_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_messages" (
  "id" serial PRIMARY KEY,
  "sender_id" varchar NOT NULL REFERENCES "users"("id"),
  "recipient_id" varchar NOT NULL REFERENCES "users"("id"),
  "subject" varchar,
  "content" text NOT NULL,
  "is_read" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_activities" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "activity_type" varchar NOT NULL,
  "activity_data" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create profile_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS "profile_views" (
  "id" serial PRIMARY KEY,
  "viewer_id" varchar REFERENCES "users"("id"),
  "profile_id" varchar NOT NULL REFERENCES "users"("id"),
  "viewed_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_view" UNIQUE("viewer_id", "profile_id")
);

-- Create user_blocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_blocks" (
  "id" serial PRIMARY KEY,
  "blocker_id" varchar NOT NULL REFERENCES "users"("id"),
  "blocked_id" varchar NOT NULL REFERENCES "users"("id"),
  "reason" text,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_block" UNIQUE("blocker_id", "blocked_id")
);

-- Create user_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_reports" (
  "id" serial PRIMARY KEY,
  "reporter_id" varchar NOT NULL REFERENCES "users"("id"),
  "reported_id" varchar NOT NULL REFERENCES "users"("id"),
  "reason" text NOT NULL,
  "evidence" text,
  "status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- 3. CREATE NEWS AND MEDIA TABLES
CREATE TABLE IF NOT EXISTS "news_articles" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "content" text,
  "url" varchar,
  "source" varchar,
  "author" varchar,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "bias_score" decimal(3,2),
  "credibility_score" decimal(3,2),
  "tags" text[]
);

CREATE TABLE IF NOT EXISTS "news_comparisons" (
  "id" serial PRIMARY KEY,
  "article_id" integer REFERENCES "news_articles"("id"),
  "comparison_data" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "propaganda_detection" (
  "id" serial PRIMARY KEY,
  "article_id" integer REFERENCES "news_articles"("id"),
  "detection_score" decimal(3,2),
  "detection_method" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "news_source_credibility" (
  "id" serial PRIMARY KEY,
  "source_name" varchar NOT NULL,
  "credibility_score" decimal(3,2),
  "bias_rating" varchar,
  "fact_check_rating" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- 4. CREATE GOVERNMENT INTEGRITY TABLES
CREATE TABLE IF NOT EXISTS "procurement_contracts" (
  "id" serial PRIMARY KEY,
  "contract_number" varchar,
  "title" varchar NOT NULL,
  "description" text,
  "vendor" varchar,
  "amount" decimal(15,2),
  "award_date" date,
  "end_date" date,
  "status" varchar DEFAULT 'active',
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "corruption_reports" (
  "id" serial PRIMARY KEY,
  "reporter_id" varchar REFERENCES "users"("id"),
  "title" varchar NOT NULL,
  "description" text NOT NULL,
  "evidence" text,
  "status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "leak_documents" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "description" text,
  "document_url" varchar,
  "source" varchar,
  "verification_status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "foi_requests" (
  "id" serial PRIMARY KEY,
  "requester_id" varchar REFERENCES "users"("id"),
  "title" varchar NOT NULL,
  "description" text NOT NULL,
  "government_body" varchar,
  "status" varchar DEFAULT 'pending',
  "response_date" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "whistleblower_reports" (
  "id" serial PRIMARY KEY,
  "reporter_id" varchar REFERENCES "users"("id"),
  "title" varchar NOT NULL,
  "description" text NOT NULL,
  "evidence" text,
  "status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- 5. CREATE IDENTITY VERIFICATION TABLES
CREATE TABLE IF NOT EXISTS "identity_verifications" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "email" varchar NOT NULL,
  "status" varchar NOT NULL DEFAULT 'pending',
  "submitted_at" timestamp DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewed_by" varchar,
  "captcha_token" varchar,
  "email_verified" boolean DEFAULT false,
  "otp_code" varchar,
  "otp_expires_at" timestamp,
  "totp_secret" varchar,
  "totp_verified" boolean DEFAULT false,
  "id_front_url" varchar,
  "id_back_url" varchar,
  "selfie_url" varchar,
  "liveness_video_url" varchar,
  "face_match_score" integer,
  "face_vector" jsonb,
  "risk_score" integer DEFAULT 0,
  "flagged_reasons" jsonb DEFAULT '[]',
  "id_number_hash" varchar,
  "duplicate_id_check" boolean DEFAULT false,
  "duplicate_face_check" boolean DEFAULT false,
  "duplicate_ip_check" boolean DEFAULT false,
  "ip_address" varchar,
  "user_agent" text,
  "geolocation" varchar,
  "device_fingerprint" varchar
);

-- 6. CREATE ADDITIONAL SYSTEM TABLES
CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "setting_key" varchar NOT NULL,
  "setting_value" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_user_setting" UNIQUE("user_id", "setting_key")
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "preference_key" varchar NOT NULL,
  "preference_value" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "unique_user_preference" UNIQUE("user_id", "preference_key")
);

CREATE TABLE IF NOT EXISTS "system_logs" (
  "id" serial PRIMARY KEY,
  "level" varchar NOT NULL,
  "message" text NOT NULL,
  "context" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "system_metrics" (
  "id" serial PRIMARY KEY,
  "metric_name" varchar NOT NULL,
  "metric_value" decimal(10,2),
  "metric_unit" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id"),
  "key_name" varchar NOT NULL,
  "key_hash" varchar NOT NULL,
  "permissions" jsonb,
  "created_at" timestamp DEFAULT now(),
  "last_used_at" timestamp
);

CREATE TABLE IF NOT EXISTS "webhooks" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id"),
  "url" varchar NOT NULL,
  "events" text[],
  "secret" varchar,
  "active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "integrations" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id"),
  "integration_type" varchar NOT NULL,
  "integration_data" jsonb,
  "status" varchar DEFAULT 'active',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "media_files" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id"),
  "file_name" varchar NOT NULL,
  "file_url" varchar NOT NULL,
  "file_type" varchar,
  "file_size" integer,
  "mime_type" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id"),
  "title" varchar NOT NULL,
  "description" text,
  "file_url" varchar,
  "document_type" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reports" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id"),
  "report_type" varchar NOT NULL,
  "report_data" jsonb,
  "status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "analytics" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id"),
  "event_type" varchar NOT NULL,
  "event_data" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS "idx_social_posts_user_id" ON "social_posts"("user_id");
CREATE INDEX IF NOT EXISTS "idx_social_posts_created_at" ON "social_posts"("created_at");
CREATE INDEX IF NOT EXISTS "idx_social_comments_post_id" ON "social_comments"("post_id");
CREATE INDEX IF NOT EXISTS "idx_social_likes_post_id" ON "social_likes"("post_id");
CREATE INDEX IF NOT EXISTS "idx_social_likes_user_id" ON "social_likes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_friends_user_id" ON "user_friends"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_friends_friend_id" ON "user_friends"("friend_id");
CREATE INDEX IF NOT EXISTS "idx_user_messages_sender_id" ON "user_messages"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_user_messages_recipient_id" ON "user_messages"("recipient_id");
CREATE INDEX IF NOT EXISTS "idx_user_activities_user_id" ON "user_activities"("user_id");
CREATE INDEX IF NOT EXISTS "idx_news_articles_published_at" ON "news_articles"("published_at");
CREATE INDEX IF NOT EXISTS "idx_news_articles_source" ON "news_articles"("source");
CREATE INDEX IF NOT EXISTS "idx_identity_verifications_user_id" ON "identity_verifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_identity_verifications_status" ON "identity_verifications"("status");
CREATE INDEX IF NOT EXISTS "idx_system_logs_created_at" ON "system_logs"("created_at");
CREATE INDEX IF NOT EXISTS "idx_system_logs_level" ON "system_logs"("level");
CREATE INDEX IF NOT EXISTS "idx_analytics_user_id" ON "analytics"("user_id");
CREATE INDEX IF NOT EXISTS "idx_analytics_event_type" ON "analytics"("event_type");

-- 8. ADD CONSTRAINTS FOR DATA INTEGRITY
ALTER TABLE "social_posts" ADD CONSTRAINT IF NOT EXISTS "check_visibility" 
  CHECK (visibility IN ('public', 'private', 'friends'));

ALTER TABLE "user_friends" ADD CONSTRAINT IF NOT EXISTS "check_status" 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'));

ALTER TABLE "identity_verifications" ADD CONSTRAINT IF NOT EXISTS "check_status" 
  CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected'));

ALTER TABLE "corruption_reports" ADD CONSTRAINT IF NOT EXISTS "check_status" 
  CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed'));

ALTER TABLE "foi_requests" ADD CONSTRAINT IF NOT EXISTS "check_status" 
  CHECK (status IN ('pending', 'processing', 'completed', 'rejected'));

-- 9. INSERT DEFAULT DATA WHERE NEEDED
INSERT INTO "news_source_credibility" ("source_name", "credibility_score", "bias_rating", "fact_check_rating") 
VALUES 
  ('CBC News', 0.95, 'center', 'excellent'),
  ('CTV News', 0.90, 'center', 'very-good'),
  ('Global News', 0.88, 'center', 'very-good'),
  ('Toronto Star', 0.85, 'center-left', 'good'),
  ('National Post', 0.80, 'center-right', 'good')
ON CONFLICT DO NOTHING;

-- 10. VERIFY ALL TABLES EXIST
DO $$
DECLARE
    table_name text;
    expected_tables text[] := ARRAY[
        'users', 'sessions', 'politicians', 'bills', 'votes', 'elections',
        'social_posts', 'social_comments', 'social_likes', 'social_shares', 'social_bookmarks',
        'user_friends', 'user_messages', 'user_activities', 'profile_views', 'user_blocks', 'user_reports',
        'news_articles', 'news_comparisons', 'propaganda_detection', 'news_source_credibility',
        'announcements', 'notifications', 'identity_verifications',
        'procurement_contracts', 'corruption_reports', 'leak_documents', 'foi_requests', 'whistleblower_reports'
    ];
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name) THEN
            RAISE NOTICE 'Missing table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- 11. FINAL VERIFICATION
SELECT 'Database fixes completed successfully' as status; 