-- Migration: Fix missing tables (2025-07-28)
-- Ensure all required tables exist in production database

-- Create user_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_votes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  target_type VARCHAR NOT NULL,
  target_id VARCHAR NOT NULL,
  option_id VARCHAR,
  timestamp TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT false,
  CONSTRAINT user_votes_user_id_target_type_target_id_unique UNIQUE(user_id, target_type, target_id)
);

-- Create vote_counts table if it doesn't exist
CREATE TABLE IF NOT EXISTS vote_counts (
  id SERIAL PRIMARY KEY,
  target_type VARCHAR NOT NULL,
  target_id VARCHAR NOT NULL,
  option_id VARCHAR NOT NULL,
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  CONSTRAINT vote_counts_target_type_target_id_option_id_unique UNIQUE(target_type, target_id, option_id)
);

-- Create user_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_interactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  interaction_type VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL,
  target_id VARCHAR NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create system_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR NOT NULL,
  metric_value JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  source VARCHAR DEFAULT 'system'
);

-- Create data_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS data_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  url VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  last_check TIMESTAMP DEFAULT NOW(),
  reliability_score NUMERIC(3,2) DEFAULT 1.00
);

-- You can safely ignore "already exists" warnings. 