-- Migration: Fix policy syntax and user_id type casting
-- This migration addresses the syntax errors from the previous migration

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public read access" ON public.petitions;
DROP POLICY IF EXISTS "Users can create petitions" ON public.petitions;
DROP POLICY IF EXISTS "Users can update own petitions" ON public.petitions;

DROP POLICY IF EXISTS "Public read access" ON public.badges;
DROP POLICY IF EXISTS "Users can create badges" ON public.badges;

DROP POLICY IF EXISTS "Public read access" ON public.campaign_finance;
DROP POLICY IF EXISTS "Users can create campaign finance records" ON public.campaign_finance;

-- Recreate policies with proper syntax
CREATE POLICY "Public read access" ON public.petitions
    FOR SELECT USING (true);

CREATE POLICY "Users can create petitions" ON public.petitions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own petitions" ON public.petitions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public read access" ON public.badges
    FOR SELECT USING (true);

CREATE POLICY "Users can create badges" ON public.badges
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Public read access" ON public.campaign_finance
    FOR SELECT USING (true);

CREATE POLICY "Users can create campaign finance records" ON public.campaign_finance
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Fix the electoral votes policy
DROP POLICY IF EXISTS "Users can update own electoral votes" ON public.electoral_votes;
CREATE POLICY "Users can update own electoral votes" ON public.electoral_votes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Add comments to document the security setup
COMMENT ON TABLE public.petitions IS 'Petitions table with RLS enabled - public read, authenticated create/update';
COMMENT ON TABLE public.badges IS 'Badges table with RLS enabled - public read, authenticated create';
COMMENT ON TABLE public.campaign_finance IS 'Campaign finance table with RLS enabled - public read, authenticated create'; 