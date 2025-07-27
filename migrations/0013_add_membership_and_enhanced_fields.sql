-- Migration to add membership types and enhanced user fields
-- This migration adds comprehensive fields for user registration and membership management

-- Add membership-related fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50) DEFAULT 'citizen';
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_end_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add enhanced address fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS apartment_unit VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_verification_method VARCHAR(50);

-- Add enhanced personal information
ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100);

-- Add professional and educational fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS employer VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_education VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS alma_mater VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- Add political engagement fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS political_experience TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS campaign_experience TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS volunteer_experience TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS advocacy_areas TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS policy_interests TEXT[];

-- Add verification and security fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_document_type VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_document_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_user_agent TEXT;

-- Add communication preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}';

-- Add membership benefits tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS feature_access JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS usage_limits JSONB DEFAULT '{}';

-- Create membership types table
CREATE TABLE IF NOT EXISTS membership_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  features JSONB DEFAULT '{}',
  access_level VARCHAR(50) DEFAULT 'basic',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user membership history table
CREATE TABLE IF NOT EXISTS user_membership_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  membership_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  amount_paid DECIMAL(10,2),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default membership types
INSERT INTO membership_types (name, description, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly, features, access_level) VALUES
('Citizen', 'Free basic access for all Canadian citizens', 0.00, 0.00, NULL, NULL, '{"basic_voting": true, "petition_access": true, "basic_forum": true}', 'basic'),
('Press', 'Enhanced access for journalists and media professionals', 29.99, 299.99, 'price_press_monthly', 'price_press_yearly', '{"advanced_analytics": true, "press_releases": true, "exclusive_content": true, "priority_support": true}', 'press'),
('Government', 'Comprehensive access for government officials and staff', 49.99, 499.99, 'price_gov_monthly', 'price_gov_yearly', '{"policy_analysis": true, "legislative_tracking": true, "stakeholder_networking": true, "custom_reports": true}', 'government');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_membership_type ON users(membership_type);
CREATE INDEX IF NOT EXISTS idx_users_membership_status ON users(membership_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_membership_history_user_id ON user_membership_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_membership_history_status ON user_membership_history(status);

-- Add comments for documentation
COMMENT ON COLUMN users.membership_type IS 'citizen, press, government';
COMMENT ON COLUMN users.membership_status IS 'active, inactive, suspended, cancelled';
COMMENT ON COLUMN users.access_level IS 'basic, press, government, admin';
COMMENT ON COLUMN users.feature_access IS 'JSON object containing feature permissions';
COMMENT ON COLUMN users.usage_limits IS 'JSON object containing usage tracking'; 