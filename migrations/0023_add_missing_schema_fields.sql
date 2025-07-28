-- Add missing fields to database schema
-- This migration adds all the missing fields that were causing TypeScript errors

-- Add missing fields to bills table
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS bill_number VARCHAR,
ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add missing field to votes table
ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS verification_id VARCHAR;

-- Add missing fields to electoral_votes table
ALTER TABLE electoral_votes 
ADD COLUMN IF NOT EXISTS vote_type VARCHAR,
ADD COLUMN IF NOT EXISTS reasoning TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT NOW();

-- Add missing fields to petitions table
ALTER TABLE petitions 
ADD COLUMN IF NOT EXISTS related_bill_id INTEGER,
ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT FALSE;

-- Add missing fields to petition_signatures table
ALTER TABLE petition_signatures 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verification_id VARCHAR;

-- Add missing fields to politicians table
ALTER TABLE politicians 
ADD COLUMN IF NOT EXISTS level VARCHAR,
ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR,
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 50.00;

-- Add missing fields to social_posts table
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS image_url VARCHAR,
ADD COLUMN IF NOT EXISTS visibility VARCHAR DEFAULT 'public';

-- Add missing field to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS source_id VARCHAR;

-- Add missing field to politician_statements table
ALTER TABLE politician_statements 
ADD COLUMN IF NOT EXISTS date_created TIMESTAMP DEFAULT NOW();

-- Add missing field to politician_positions table
ALTER TABLE politician_positions 
ADD COLUMN IF NOT EXISTS date_stated TIMESTAMP DEFAULT NOW();

-- Add missing field to campaign_finance table
ALTER TABLE campaign_finance 
ADD COLUMN IF NOT EXISTS reporting_period TIMESTAMP;

-- Add missing field to politician_truth_tracking table
ALTER TABLE politician_truth_tracking 
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP DEFAULT NOW();

-- Add missing field to fact_checks table
ALTER TABLE fact_checks 
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP DEFAULT NOW();

-- Add missing fields to legal_acts table
ALTER TABLE legal_acts 
ADD COLUMN IF NOT EXISTS full_text TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  notification_types JSONB DEFAULT '{}',
  quiet_hours JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create voting_items table
CREATE TABLE IF NOT EXISTS voting_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_politicians_jurisdiction ON politicians(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_politicians_level ON politicians(level);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON social_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_signed_at ON petition_signatures(signed_at);
CREATE INDEX IF NOT EXISTS idx_politician_statements_date_created ON politician_statements(date_created);
CREATE INDEX IF NOT EXISTS idx_politician_positions_date_stated ON politician_positions(date_stated);
CREATE INDEX IF NOT EXISTS idx_campaign_finance_reporting_period ON campaign_finance(reporting_period);
CREATE INDEX IF NOT EXISTS idx_fact_checks_checked_at ON fact_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_voting_items_type ON voting_items(type);
CREATE INDEX IF NOT EXISTS idx_voting_items_status ON voting_items(status);

-- Insert some default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id, email_notifications, push_notifications, sms_notifications)
SELECT id, true, true, false FROM users 
ON CONFLICT (user_id) DO NOTHING;

-- Insert some default voting items
INSERT INTO voting_items (title, description, type, status) VALUES
('General Voting', 'General voting items for citizens', 'general', 'active'),
('Bill Voting', 'Voting on proposed bills', 'bill', 'active'),
('Motion Voting', 'Voting on parliamentary motions', 'motion', 'active')
ON CONFLICT DO NOTHING; 