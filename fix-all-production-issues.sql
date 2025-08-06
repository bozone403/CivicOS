-- COMPREHENSIVE PRODUCTION FIXES
-- This script fixes all identified issues from the production audit

-- 1. Fix announcements table - add missing expires_at column
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- 2. Create missing social tables for advanced features
CREATE TABLE IF NOT EXISTS social_conversations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  other_user_id VARCHAR NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_messages (
  id SERIAL PRIMARY KEY,
  sender_id VARCHAR NOT NULL,
  recipient_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  title VARCHAR,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  source_module VARCHAR,
  source_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  bookmarked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_shares (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL,
  platform VARCHAR DEFAULT 'internal',
  shared_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create missing system tables
CREATE TABLE IF NOT EXISTS system_health (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  response_time INTEGER,
  last_check TIMESTAMP DEFAULT NOW(),
  details JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  event_type VARCHAR NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW(),
  session_id VARCHAR,
  ip_address VARCHAR
);

-- 4. Create missing identity tables
CREATE TABLE IF NOT EXISTS identity_verifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  verification_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  verification_data JSONB DEFAULT '{}',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create missing permissions tables
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  permission_id INTEGER NOT NULL,
  permission_name VARCHAR NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by VARCHAR,
  expires_at TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create missing membership tables
CREATE TABLE IF NOT EXISTS user_membership_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  membership_type VARCHAR NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  reason VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'active'
);

-- 7. Create missing payment tables
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'CAD',
  payment_method VARCHAR,
  status VARCHAR NOT NULL,
  transaction_id VARCHAR,
  payment_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create missing file upload tables
CREATE TABLE IF NOT EXISTS file_uploads (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  upload_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Create missing webhook tables
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  url VARCHAR NOT NULL,
  events JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  secret_key VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Create missing development tools tables
CREATE TABLE IF NOT EXISTS development_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Create missing voting tables
CREATE TABLE IF NOT EXISTS voting_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,
  options JSONB NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  voting_item_id INTEGER NOT NULL,
  selected_option VARCHAR NOT NULL,
  vote_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Create missing news tables
CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT,
  summary TEXT,
  source VARCHAR,
  source_id INTEGER,
  url VARCHAR,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Create missing legal tables
CREATE TABLE IF NOT EXISTS legal_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  document_type VARCHAR,
  content TEXT,
  file_path VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 14. Create missing government integrity tables
CREATE TABLE IF NOT EXISTS government_integrity (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  integrity_score DECIMAL(3,2),
  category VARCHAR,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. Create missing events tables
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  event_type VARCHAR,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  location VARCHAR,
  organizer_id VARCHAR,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_messages_sender ON social_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_recipient ON social_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_activities_user ON social_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_social_bookmarks_user ON social_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_item ON votes(voting_item_id);

-- Add foreign key constraints
ALTER TABLE social_messages ADD CONSTRAINT IF NOT EXISTS fk_social_messages_sender 
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE social_messages ADD CONSTRAINT IF NOT EXISTS fk_social_messages_recipient 
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE social_notifications ADD CONSTRAINT IF NOT EXISTS fk_social_notifications_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE social_activities ADD CONSTRAINT IF NOT EXISTS fk_social_activities_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE social_bookmarks ADD CONSTRAINT IF NOT EXISTS fk_social_bookmarks_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE social_bookmarks ADD CONSTRAINT IF NOT EXISTS fk_social_bookmarks_post 
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;

ALTER TABLE social_shares ADD CONSTRAINT IF NOT EXISTS fk_social_shares_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE social_shares ADD CONSTRAINT IF NOT EXISTS fk_social_shares_post 
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;

ALTER TABLE identity_verifications ADD CONSTRAINT IF NOT EXISTS fk_identity_verifications_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_permissions ADD CONSTRAINT IF NOT EXISTS fk_user_permissions_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_membership_history ADD CONSTRAINT IF NOT EXISTS fk_user_membership_history_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT IF NOT EXISTS fk_payments_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE file_uploads ADD CONSTRAINT IF NOT EXISTS fk_file_uploads_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE votes ADD CONSTRAINT IF NOT EXISTS fk_votes_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE votes ADD CONSTRAINT IF NOT EXISTS fk_votes_item 
  FOREIGN KEY (voting_item_id) REFERENCES voting_items(id) ON DELETE CASCADE;

-- Insert default data
INSERT INTO permissions (name, description, category) VALUES 
('create_announcements', 'Can create announcements', 'content'),
('edit_announcements', 'Can edit announcements', 'content'),
('delete_announcements', 'Can delete announcements', 'content'),
('pin_announcements', 'Can pin announcements', 'content'),
('view_analytics', 'Can view analytics', 'system'),
('manage_users', 'Can manage users', 'admin'),
('manage_system', 'Can manage system settings', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Verify table creation
DO $$
DECLARE
  table_name TEXT;
  expected_tables TEXT[] := ARRAY[
    'social_conversations', 'social_messages', 'social_notifications', 
    'social_activities', 'social_bookmarks', 'social_shares',
    'system_health', 'analytics_events', 'identity_verifications',
    'user_permissions', 'permissions', 'user_membership_history',
    'payments', 'file_uploads', 'webhooks', 'development_logs',
    'voting_items', 'votes', 'news_articles', 'legal_documents',
    'government_integrity', 'events'
  ];
BEGIN
  FOREACH table_name IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name) THEN
      RAISE NOTICE 'Table % does not exist', table_name;
    ELSE
      RAISE NOTICE 'Table % exists', table_name;
    END IF;
  END LOOP;
END $$; 