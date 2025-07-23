-- Migration: Complete user fields migration
-- Date: 2025-01-20

-- Add missing user fields that are required for registration
DO $$
BEGIN
    -- Add phoneNumber if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN
        ALTER TABLE users ADD COLUMN phone_number varchar(255);
    END IF;

    -- Add dateOfBirth if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'date_of_birth') THEN
        ALTER TABLE users ADD COLUMN date_of_birth timestamp;
    END IF;

    -- Add federalRiding if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'federal_riding') THEN
        ALTER TABLE users ADD COLUMN federal_riding varchar(255);
    END IF;

    -- Add provincialRiding if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'provincial_riding') THEN
        ALTER TABLE users ADD COLUMN provincial_riding varchar(255);
    END IF;

    -- Add municipalWard if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'municipal_ward') THEN
        ALTER TABLE users ADD COLUMN municipal_ward varchar(255);
    END IF;

    -- Add citizenshipStatus if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'citizenship_status') THEN
        ALTER TABLE users ADD COLUMN citizenship_status varchar(255) DEFAULT 'citizen';
    END IF;

    -- Add voterRegistrationStatus if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'voter_registration_status') THEN
        ALTER TABLE users ADD COLUMN voter_registration_status varchar(255) DEFAULT 'unknown';
    END IF;

    -- Add communicationStyle if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'communication_style') THEN
        ALTER TABLE users ADD COLUMN communication_style varchar(255) DEFAULT 'auto';
    END IF;

    -- Add governmentIdVerified if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'government_id_verified') THEN
        ALTER TABLE users ADD COLUMN government_id_verified boolean DEFAULT false;
    END IF;

    -- Add governmentIdType if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'government_id_type') THEN
        ALTER TABLE users ADD COLUMN government_id_type varchar(255);
    END IF;

    -- Add verificationLevel if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_level') THEN
        ALTER TABLE users ADD COLUMN verification_level varchar(255) DEFAULT 'unverified';
    END IF;

    -- Add isVerified if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified boolean DEFAULT false;
    END IF;

    -- Add civicLevel if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'civic_level') THEN
        ALTER TABLE users ADD COLUMN civic_level varchar(255) DEFAULT 'Registered';
    END IF;

    -- Add trustScore if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trust_score') THEN
        ALTER TABLE users ADD COLUMN trust_score decimal(5,2) DEFAULT '100.00';
    END IF;

    -- Add latitude if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'latitude') THEN
        ALTER TABLE users ADD COLUMN latitude decimal(10,8);
    END IF;

    -- Add longitude if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longitude') THEN
        ALTER TABLE users ADD COLUMN longitude decimal(11,8);
    END IF;

    -- Add country if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE users ADD COLUMN country varchar(255) DEFAULT 'Canada';
    END IF;

    -- Add addressVerified if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_verified') THEN
        ALTER TABLE users ADD COLUMN address_verified boolean DEFAULT false;
    END IF;

    -- Add locationAccuracy if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'location_accuracy') THEN
        ALTER TABLE users ADD COLUMN location_accuracy integer;
    END IF;

    -- Add locationTimestamp if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'location_timestamp') THEN
        ALTER TABLE users ADD COLUMN location_timestamp timestamp;
    END IF;

    -- Add ipAddress if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ip_address') THEN
        ALTER TABLE users ADD COLUMN ip_address varchar(255);
    END IF;

    -- Add deviceFingerprint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'device_fingerprint') THEN
        ALTER TABLE users ADD COLUMN device_fingerprint varchar(255);
    END IF;

    -- Add authenticationHistory if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'authentication_history') THEN
        ALTER TABLE users ADD COLUMN authentication_history jsonb;
    END IF;

    -- Add profileCompleteness if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_completeness') THEN
        ALTER TABLE users ADD COLUMN profile_completeness integer DEFAULT 0;
    END IF;

    -- Add identityVerificationScore if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'identity_verification_score') THEN
        ALTER TABLE users ADD COLUMN identity_verification_score decimal(5,2) DEFAULT '0.00';
    END IF;

    -- Add residencyVerified if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'residency_verified') THEN
        ALTER TABLE users ADD COLUMN residency_verified boolean DEFAULT false;
    END IF;

    -- Add civicPoints if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'civic_points') THEN
        ALTER TABLE users ADD COLUMN civic_points integer DEFAULT 0;
    END IF;

    -- Add currentLevel if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_level') THEN
        ALTER TABLE users ADD COLUMN current_level integer DEFAULT 1;
    END IF;

    -- Add totalBadges if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_badges') THEN
        ALTER TABLE users ADD COLUMN total_badges integer DEFAULT 0;
    END IF;

    -- Add streakDays if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'streak_days') THEN
        ALTER TABLE users ADD COLUMN streak_days integer DEFAULT 0;
    END IF;

    -- Add lastActivityDate if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_activity_date') THEN
        ALTER TABLE users ADD COLUMN last_activity_date timestamp;
    END IF;

    -- Add achievementTier if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'achievement_tier') THEN
        ALTER TABLE users ADD COLUMN achievement_tier varchar(255) DEFAULT 'bronze';
    END IF;

    -- Add politicalAwarenessScore if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'political_awareness_score') THEN
        ALTER TABLE users ADD COLUMN political_awareness_score decimal(5,2) DEFAULT '0.00';
    END IF;

    -- Add engagementLevel if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'engagement_level') THEN
        ALTER TABLE users ADD COLUMN engagement_level varchar(255) DEFAULT 'newcomer';
    END IF;

    -- Add monthlyGoal if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'monthly_goal') THEN
        ALTER TABLE users ADD COLUMN monthly_goal integer DEFAULT 100;
    END IF;

    -- Add yearlyGoal if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'yearly_goal') THEN
        ALTER TABLE users ADD COLUMN yearly_goal integer DEFAULT 1200;
    END IF;

END $$; 