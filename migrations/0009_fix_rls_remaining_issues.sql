-- Migration: Fix remaining RLS issues and add missing user_id columns
-- This migration addresses the errors from the previous RLS migration

-- Add user_id column to tables that need it for RLS policies
ALTER TABLE public.petitions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.campaign_finance ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop duplicate policies if they exist
DROP POLICY IF EXISTS "Public read access" ON public.electoral_votes;
DROP POLICY IF EXISTS "Users can update own electoral votes" ON public.electoral_votes;

-- Recreate the electoral votes policies
CREATE POLICY "Public read access" ON public.electoral_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can update own electoral votes" ON public.electoral_votes
    FOR UPDATE USING (auth.uid() = user_id);

-- Add policies for tables that were missing them
CREATE POLICY IF NOT EXISTS "Public read access" ON public.petitions
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create petitions" ON public.petitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own petitions" ON public.petitions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Public read access" ON public.badges
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create badges" ON public.badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Public read access" ON public.campaign_finance
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create campaign finance records" ON public.campaign_finance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update existing records to have user_id where needed
-- For demonstration purposes, we'll set a default user_id for existing records
-- In production, you'd want to properly map these to actual users

UPDATE public.petitions 
SET user_id = (SELECT id FROM auth.users LIMIT 1) 
WHERE user_id IS NULL;

UPDATE public.badges 
SET user_id = (SELECT id FROM auth.users LIMIT 1) 
WHERE user_id IS NULL;

UPDATE public.campaign_finance 
SET user_id = (SELECT id FROM auth.users LIMIT 1) 
WHERE user_id IS NULL;

-- Add comments to document the security setup
COMMENT ON TABLE public.petitions IS 'Petitions table with RLS enabled - public read, authenticated create/update';
COMMENT ON TABLE public.badges IS 'Badges table with RLS enabled - public read, authenticated create';
COMMENT ON TABLE public.campaign_finance IS 'Campaign finance table with RLS enabled - public read, authenticated create'; 