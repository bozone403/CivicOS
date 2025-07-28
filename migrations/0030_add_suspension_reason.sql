-- Migration: Add suspension_reason column (2025-07-28)
-- Fix missing suspension_reason column causing auth 500 errors

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS suspension_reason TEXT; 