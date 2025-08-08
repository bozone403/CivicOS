-- Create identity_verifications table if not exists
CREATE TABLE IF NOT EXISTS identity_verifications (
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
  flagged_reasons JSONB DEFAULT '[]'::jsonb,
  id_number_hash VARCHAR,
  duplicate_id_check BOOLEAN DEFAULT FALSE,
  duplicate_face_check BOOLEAN DEFAULT FALSE,
  duplicate_ip_check BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR,
  user_agent TEXT,
  geolocation VARCHAR,
  device_fingerprint VARCHAR,
  terms_agreed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user ON identity_verifications(user_id);


