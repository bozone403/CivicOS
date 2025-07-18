-- CivicOS Production Database Schema
-- Only essential tables, relationships, and RLS policies

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  electoral_district VARCHAR,
  phone_number VARCHAR,
  date_of_birth TIMESTAMP,
  government_id_verified BOOLEAN DEFAULT FALSE,
  government_id_type VARCHAR,
  verification_level VARCHAR DEFAULT 'unverified',
  communication_style VARCHAR DEFAULT 'auto',
  is_verified BOOLEAN DEFAULT FALSE,
  civic_level VARCHAR DEFAULT 'Registered',
  trust_score DECIMAL(5,2) DEFAULT 100.00,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  city VARCHAR,
  province VARCHAR,
  postal_code VARCHAR,
  country VARCHAR DEFAULT 'Canada',
  federal_riding VARCHAR,
  provincial_riding VARCHAR,
  municipal_ward VARCHAR,
  address_verified BOOLEAN DEFAULT FALSE,
  location_accuracy INTEGER,
  location_timestamp TIMESTAMP,
  ip_address VARCHAR,
  device_fingerprint VARCHAR,
  authentication_history JSONB,
  profile_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES public.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Civic Activities table (example)
CREATE TABLE IF NOT EXISTS public.civic_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES public.users(id),
  activity_type VARCHAR NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies (optimized)
CREATE POLICY "Users can manage own user data" ON public.users
  USING ((select auth.uid())::text = id);
CREATE POLICY "Users can manage own notifications" ON public.notifications
  USING ((select auth.uid())::text = user_id);
CREATE POLICY "Users can manage own activities" ON public.civic_activities
  USING ((select auth.uid())::text = user_id);

-- Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable insert for authenticated users" ON public.notifications
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable insert for authenticated users" ON public.civic_activities
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Identity Verification table
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR,
  captcha_token VARCHAR,
  email_verified BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR,
  otp_expires_at TIMESTAMP,
  totp_secret VARCHAR,
  totp_verified BOOLEAN DEFAULT FALSE,
  id_front_url VARCHAR,
  id_back_url VARCHAR,
  selfie_url VARCHAR,
  liveness_video_url VARCHAR,
  face_match_score INTEGER,
  face_vector JSONB,
  risk_score INTEGER DEFAULT 0,
  flagged_reasons JSONB DEFAULT '[]',
  id_number_hash VARCHAR,
  duplicate_id_check BOOLEAN DEFAULT FALSE,
  duplicate_face_check BOOLEAN DEFAULT FALSE,
  duplicate_ip_check BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR,
  user_agent TEXT,
  geolocation VARCHAR,
  device_fingerprint VARCHAR
);

-- Add more tables as needed for production, following the same pattern. 