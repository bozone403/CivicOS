-- Add final missing fields to database schema

-- Add missing field to petitions table
ALTER TABLE petitions 
ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMP;

-- Add missing fields to news_articles table
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS bias VARCHAR,
ADD COLUMN IF NOT EXISTS credibility_score DECIMAL(3,2);

-- Add missing fields to electoral_districts table
ALTER TABLE electoral_districts 
ADD COLUMN IF NOT EXISTS district_name VARCHAR,
ADD COLUMN IF NOT EXISTS district_number VARCHAR,
ADD COLUMN IF NOT EXISTS province VARCHAR,
ADD COLUMN IF NOT EXISTS area VARCHAR,
ADD COLUMN IF NOT EXISTS major_cities TEXT[],
ADD COLUMN IF NOT EXISTS current_representative VARCHAR,
ADD COLUMN IF NOT EXISTS last_election_turnout VARCHAR,
ADD COLUMN IF NOT EXISTS is_urban BOOLEAN,
ADD COLUMN IF NOT EXISTS is_rural BOOLEAN;

-- Add missing field to user_membership_history table
ALTER TABLE user_membership_history 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active';

-- Add missing field to bills table
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS category VARCHAR;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_petitions_deadline_date ON petitions(deadline_date);
CREATE INDEX IF NOT EXISTS idx_news_articles_summary ON news_articles(summary);
CREATE INDEX IF NOT EXISTS idx_news_articles_bias ON news_articles(bias);
CREATE INDEX IF NOT EXISTS idx_news_articles_credibility_score ON news_articles(credibility_score);
CREATE INDEX IF NOT EXISTS idx_electoral_districts_district_name ON electoral_districts(district_name);
CREATE INDEX IF NOT EXISTS idx_electoral_districts_province ON electoral_districts(province);
CREATE INDEX IF NOT EXISTS idx_user_membership_history_status ON user_membership_history(status);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category); 