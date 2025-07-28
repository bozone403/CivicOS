-- Migration: Enhance announcements table with missing fields
-- This migration adds the missing fields that the announcements routes expect

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

-- Add foreign key constraint for author_id
ALTER TABLE announcements 
ADD CONSTRAINT fk_announcements_author_id 
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL; 