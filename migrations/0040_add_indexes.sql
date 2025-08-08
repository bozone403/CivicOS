-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_isread ON notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_messages_sender_recipient_time ON user_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_time ON user_messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_likes_post_user ON social_likes (post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_post_time ON social_comments (post_id, created_at DESC);


