-- Migration: Comprehensive politicians table fix (2025-07-28)
-- Fix all missing columns in politicians table to match schema exactly

-- First, ensure the table exists with all required fields
CREATE TABLE IF NOT EXISTS politicians (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  party VARCHAR,
  position VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  party_affiliation VARCHAR,
  constituency VARCHAR,
  election_date DATE,
  term_start DATE,
  term_end DATE,
  is_incumbent BOOLEAN DEFAULT false,
  biography TEXT,
  contact_info JSONB DEFAULT '{}',
  social_media JSONB DEFAULT '{}',
  voting_record JSONB DEFAULT '{}',
  level VARCHAR,
  jurisdiction VARCHAR,
  trust_score NUMERIC(5,2) DEFAULT 50.00
);

-- Add any missing columns to existing table
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY,
  ADD COLUMN IF NOT EXISTS name VARCHAR NOT NULL,
  ADD COLUMN IF NOT EXISTS party VARCHAR,
  ADD COLUMN IF NOT EXISTS position VARCHAR,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS party_affiliation VARCHAR,
  ADD COLUMN IF NOT EXISTS constituency VARCHAR,
  ADD COLUMN IF NOT EXISTS election_date DATE,
  ADD COLUMN IF NOT EXISTS term_start DATE,
  ADD COLUMN IF NOT EXISTS term_end DATE,
  ADD COLUMN IF NOT EXISTS is_incumbent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS biography TEXT,
  ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS voting_record JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS level VARCHAR,
  ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR,
  ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5,2) DEFAULT 50.00;

-- You can safely ignore "already exists" warnings. 