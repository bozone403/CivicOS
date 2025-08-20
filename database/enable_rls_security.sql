-- Enable Row Level Security (RLS) on all public tables
-- This script addresses the Supabase security linting errors
-- Run this in your Supabase SQL editor

-- 1. Enable RLS on membership and permission tables
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_membership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on social and communication tables
ALTER TABLE public.social_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on content and article tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on system and analytics tables
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_logs ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS on file and webhook tables
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- 6. Enable RLS on business logic tables
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_integrity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for core user data tables
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Social posts - users can see all posts, but only edit/delete their own
CREATE POLICY "Users can view all posts" ON public.social_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.social_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.social_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.social_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Social comments - users can see all comments, but only edit/delete their own
CREATE POLICY "Users can view all comments" ON public.social_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.social_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.social_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.social_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Social likes - users can see all likes, but only create/delete their own
CREATE POLICY "Users can view all likes" ON public.social_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON public.social_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.social_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Messages - users can only see messages they're involved in
CREATE POLICY "Users can view own messages" ON public.social_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

CREATE POLICY "Users can send messages" ON public.social_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- User follows - users can see all follows, but only manage their own
CREATE POLICY "Users can view all follows" ON public.user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can create follows" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON public.user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Notifications - users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.social_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications" ON public.social_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.social_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- File uploads - users can only see their own uploads
CREATE POLICY "Users can view own uploads" ON public.file_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" ON public.file_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" ON public.file_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- Public data tables - everyone can read, only admins can modify
-- Politicians, bills, elections, legal acts, etc.
CREATE POLICY "Public read access to politicians" ON public.politicians
    FOR SELECT USING (true);

CREATE POLICY "Public read access to bills" ON public.bills
    FOR SELECT USING (true);

CREATE POLICY "Public read access to elections" ON public.elections
    FOR SELECT USING (true);

CREATE POLICY "Public read access to legal_acts" ON public.legal_acts
    FOR SELECT USING (true);

CREATE POLICY "Public read access to legal_cases" ON public.legal_cases
    FOR SELECT USING (true);

CREATE POLICY "Public read access to procurement_contracts" ON public.procurement_contracts
    FOR SELECT USING (true);

CREATE POLICY "Public read access to lobbyists" ON public.lobbyists
    FOR SELECT USING (true);

-- Admin-only policies for sensitive operations
-- These tables should only be accessible by authenticated users with admin privileges
CREATE POLICY "Admin only - membership types" ON public.membership_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin only - permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin only - system metrics" ON public.system_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin only - moderation actions" ON public.moderation_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Identity verifications - users can only see their own
CREATE POLICY "Users can view own verifications" ON public.identity_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create verifications" ON public.identity_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments - users can only see their own
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events - public read, authenticated users can create
CREATE POLICY "Public read access to events" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id);

-- Announcements - public read, admin only create/update/delete
CREATE POLICY "Public read access to announcements" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Admin only - announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Article comments and likes - public read, authenticated users can interact
CREATE POLICY "Public read access to article comments" ON public.article_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.article_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.article_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.article_comments
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public read access to article likes" ON public.article_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.article_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.article_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Webhooks - admin only
CREATE POLICY "Admin only - webhooks" ON public.webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Data sources - admin only
CREATE POLICY "Admin only - data sources" ON public.data_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Development logs - admin only
CREATE POLICY "Admin only - development logs" ON public.development_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Government integrity - public read, admin only modify
CREATE POLICY "Public read access to government integrity" ON public.government_integrity
    FOR SELECT USING (true);

CREATE POLICY "Admin only - government integrity" ON public.government_integrity
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Legal documents - public read, admin only modify
CREATE POLICY "Public read access to legal documents" ON public.legal_documents
    FOR SELECT USING (true);

CREATE POLICY "Admin only - legal documents" ON public.legal_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Social conversations - users can only see conversations they're part of
CREATE POLICY "Users can view own conversations" ON public.social_conversations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.conversation_participants 
            WHERE conversation_id = id
        )
    );

CREATE POLICY "Users can create conversations" ON public.social_conversations
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Social activities - public read, users can only create their own
CREATE POLICY "Public read access to social activities" ON public.social_activities
    FOR SELECT USING (true);

CREATE POLICY "Users can create own activities" ON public.social_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Membership permissions - admin only
CREATE POLICY "Admin only - membership permissions" ON public.membership_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- User membership history - users can only see their own
CREATE POLICY "Users can view own membership history" ON public.user_membership_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all memberships" ON public.user_membership_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System health - admin only
CREATE POLICY "Admin only - system health" ON public.system_health
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Analytics events - admin only
CREATE POLICY "Admin only - analytics events" ON public.analytics_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
