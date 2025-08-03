-- Fix announcements table schema
-- Add missing columns that the code expects

ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure all required columns exist
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS author_id VARCHAR,
ADD COLUMN IF NOT EXISTS author_name VARCHAR,
ADD COLUMN IF NOT EXISTS author_membership_type VARCHAR DEFAULT 'citizen',
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'published',
ADD COLUMN IF NOT EXISTS target_audience VARCHAR DEFAULT 'all',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active); 