-- Fix permissions schema by adding missing fields and constraints

-- Add missing fields to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS permission_name VARCHAR NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS is_granted BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing fields to membership_permissions table  
ALTER TABLE membership_permissions
ADD COLUMN IF NOT EXISTS permission_name VARCHAR NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS is_granted BOOLEAN DEFAULT TRUE;

-- Add missing field to permissions table
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add foreign key constraints
ALTER TABLE user_permissions 
ADD CONSTRAINT fk_user_permissions_permission_id 
FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

ALTER TABLE membership_permissions 
ADD CONSTRAINT fk_membership_permissions_permission_id 
FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- Insert default permissions
INSERT INTO permissions (name, description, category, is_active) VALUES
('create_announcements', 'Create official announcements', 'announcement', true),
('edit_announcements', 'Edit announcements', 'announcement', true),
('delete_announcements', 'Delete announcements', 'announcement', true),
('pin_announcements', 'Pin announcements to top', 'announcement', true),
('create_articles', 'Create news articles', 'news', true),
('edit_articles', 'Edit news articles', 'news', true),
('delete_articles', 'Delete news articles', 'news', true),
('feature_articles', 'Feature articles', 'news', true),
('fact_check_articles', 'Fact check articles', 'news', true),
('publish_without_review', 'Publish content without review', 'content', true),
('moderate_comments', 'Moderate user comments', 'moderation', true),
('moderate_articles', 'Moderate articles', 'moderation', true),
('moderate_users', 'Moderate user accounts', 'moderation', true),
('approve_content', 'Approve content', 'moderation', true),
('reject_content', 'Reject content', 'moderation', true),
('view_analytics', 'View platform analytics', 'analytics', true),
('export_data', 'Export platform data', 'analytics', true),
('view_user_activity', 'View user activity', 'analytics', true),
('manage_users', 'Manage user accounts', 'admin', true),
('manage_permissions', 'Manage user permissions', 'admin', true),
('system_settings', 'Access system settings', 'admin', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default membership permissions
INSERT INTO membership_permissions (membership_type, permission_id, permission_name, is_granted) 
SELECT 'citizen', id, name, true FROM permissions WHERE name IN (
  'create_announcements',
  'create_articles',
  'moderate_comments',
  'view_analytics'
)
ON CONFLICT (membership_type, permission_id) DO NOTHING;

INSERT INTO membership_permissions (membership_type, permission_id, permission_name, is_granted) 
SELECT 'press', id, name, true FROM permissions WHERE name IN (
  'create_announcements',
  'edit_announcements',
  'create_articles',
  'edit_articles',
  'publish_without_review',
  'moderate_comments',
  'moderate_articles',
  'approve_content',
  'reject_content',
  'view_analytics',
  'export_data',
  'view_user_activity',
  'fact_check_articles',
  'feature_articles'
)
ON CONFLICT (membership_type, permission_id) DO NOTHING;

INSERT INTO membership_permissions (membership_type, permission_id, permission_name, is_granted) 
SELECT 'government', id, name, true FROM permissions WHERE name IN (
  'create_announcements',
  'edit_announcements',
  'delete_announcements',
  'pin_announcements',
  'create_articles',
  'edit_articles',
  'delete_articles',
  'feature_articles',
  'fact_check_articles',
  'publish_without_review',
  'moderate_comments',
  'moderate_articles',
  'moderate_users',
  'approve_content',
  'reject_content',
  'view_analytics',
  'export_data',
  'view_user_activity',
  'manage_users',
  'manage_permissions',
  'system_settings'
)
ON CONFLICT (membership_type, permission_id) DO NOTHING; 