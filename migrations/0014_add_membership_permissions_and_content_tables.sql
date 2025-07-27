-- Migration to add membership-based permissions and content creation tables
-- This migration adds comprehensive permission system and content creation capabilities

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'announcement', 'news', 'moderation', 'analytics', etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create membership permissions table
CREATE TABLE IF NOT EXISTS membership_permissions (
  id SERIAL PRIMARY KEY,
  membership_type VARCHAR(50) NOT NULL, -- 'citizen', 'press', 'government'
  permission_id INTEGER REFERENCES permissions(id),
  permission_name VARCHAR(100) NOT NULL, -- Direct reference for easier queries
  is_granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(255) REFERENCES users(id),
  author_name VARCHAR(255) NOT NULL,
  author_membership_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'published', -- 'draft', 'published', 'archived'
  priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'citizens', 'press', 'government'
  is_pinned BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Add new columns to existing news_articles table
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_membership_type VARCHAR(50);
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS read_time INTEGER;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS fact_check_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS fact_check_notes TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- Create article comments table
CREATE TABLE IF NOT EXISTS article_comments (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES news_articles(id),
  author_id VARCHAR(255) REFERENCES users(id),
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES article_comments(id),
  likes_count INTEGER DEFAULT 0,
  is_moderated BOOLEAN DEFAULT FALSE,
  moderation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create article likes table
CREATE TABLE IF NOT EXISTS article_likes (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES news_articles(id),
  user_id VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Create user permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  permission_name VARCHAR(100) NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  granted_by VARCHAR(255) REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  notes TEXT
);

-- Create moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id SERIAL PRIMARY KEY,
  moderator_id VARCHAR(255) REFERENCES users(id),
  target_type VARCHAR(50) NOT NULL, -- 'article', 'comment', 'announcement', 'user'
  target_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'edit', 'delete', 'warn', 'suspend'
  reason TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
-- Announcement permissions
('create_announcements', 'Create and publish announcements', 'announcement'),
('edit_announcements', 'Edit existing announcements', 'announcement'),
('delete_announcements', 'Delete announcements', 'announcement'),
('pin_announcements', 'Pin announcements to top', 'announcement'),

-- News article permissions
('create_articles', 'Create and publish news articles', 'news'),
('edit_articles', 'Edit existing articles', 'news'),
('delete_articles', 'Delete articles', 'news'),
('feature_articles', 'Feature articles on homepage', 'news'),
('fact_check_articles', 'Perform fact-checking on articles', 'news'),
('publish_without_review', 'Publish articles without review', 'news'),

-- Moderation permissions
('moderate_comments', 'Moderate user comments', 'moderation'),
('moderate_articles', 'Moderate news articles', 'moderation'),
('moderate_users', 'Moderate user accounts', 'moderation'),
('approve_content', 'Approve pending content', 'moderation'),
('reject_content', 'Reject inappropriate content', 'moderation'),

-- Analytics permissions
('view_analytics', 'View platform analytics', 'analytics'),
('export_data', 'Export platform data', 'analytics'),
('view_user_activity', 'View detailed user activity', 'analytics'),

-- Administrative permissions
('manage_users', 'Manage user accounts', 'admin'),
('manage_permissions', 'Manage user permissions', 'admin'),
('system_settings', 'Modify system settings', 'admin');

-- Insert membership permissions (Citizen - basic access)
INSERT INTO membership_permissions (membership_type, permission_name) VALUES
('citizen', 'create_announcements'),
('citizen', 'create_articles'),
('citizen', 'moderate_comments'),
('citizen', 'view_analytics');

-- Insert membership permissions (Press - enhanced access)
INSERT INTO membership_permissions (membership_type, permission_name) VALUES
('press', 'create_announcements'),
('press', 'edit_announcements'),
('press', 'create_articles'),
('press', 'edit_articles'),
('press', 'publish_without_review'),
('press', 'moderate_comments'),
('press', 'moderate_articles'),
('press', 'approve_content'),
('press', 'reject_content'),
('press', 'view_analytics'),
('press', 'export_data'),
('press', 'view_user_activity'),
('press', 'fact_check_articles'),
('press', 'feature_articles');

-- Insert membership permissions (Government - full access)
INSERT INTO membership_permissions (membership_type, permission_name) VALUES
('government', 'create_announcements'),
('government', 'edit_announcements'),
('government', 'delete_announcements'),
('government', 'pin_announcements'),
('government', 'create_articles'),
('government', 'edit_articles'),
('government', 'delete_articles'),
('government', 'feature_articles'),
('government', 'fact_check_articles'),
('government', 'publish_without_review'),
('government', 'moderate_comments'),
('government', 'moderate_articles'),
('government', 'moderate_users'),
('government', 'approve_content'),
('government', 'reject_content'),
('government', 'view_analytics'),
('government', 'export_data'),
('government', 'view_user_activity'),
('government', 'manage_users'),
('government', 'manage_permissions'),
('government', 'system_settings');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_membership_permissions_type ON membership_permissions(membership_type);
CREATE INDEX IF NOT EXISTS idx_membership_permissions_name ON membership_permissions(permission_name);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);
-- Note: news_articles table already has category and featured indexes
-- CREATE INDEX IF NOT EXISTS idx_news_articles_author ON news_articles(author_id);
-- CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
-- CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
-- CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON news_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_author ON article_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_article ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user ON article_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_name ON user_permissions(permission_name);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'Available permissions in the system';
COMMENT ON TABLE membership_permissions IS 'Permissions granted to each membership type';
COMMENT ON TABLE announcements IS 'Official announcements from authorized users';
COMMENT ON TABLE article_comments IS 'Comments on news articles';
COMMENT ON TABLE article_likes IS 'User likes on news articles';
COMMENT ON TABLE user_permissions IS 'Individual user permissions (overrides membership)';
COMMENT ON TABLE moderation_actions IS 'Log of moderation actions taken'; 