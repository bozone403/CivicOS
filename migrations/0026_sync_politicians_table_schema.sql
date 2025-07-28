-- Migration: Sync politicians table schema (2025-07-28)
-- Fix missing columns causing "Error storing official" 42703 errors

ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS level VARCHAR DEFAULT 'Federal',
  ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR DEFAULT 'Federal',
  ADD COLUMN IF NOT EXISTS biography TEXT,
  ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS voting_record JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5,2) DEFAULT 50.00;

-- You can safely ignore "already exists" warnings. 