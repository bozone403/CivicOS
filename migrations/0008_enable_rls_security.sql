-- Migration: Enable Row Level Security (RLS) on all public tables
-- This migration addresses Supabase security linter warnings

-- Enable RLS on all tables
ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electoral_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_source_credibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provincial_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_controversies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criminal_code_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_truth_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polling_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propaganda_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provincial_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charter_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electoral_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electoral_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (most tables should be publicly readable)
-- Users table - users can only read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- Public data tables - allow public read access
CREATE POLICY "Public read access" ON public.politicians
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.bills
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.elections
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.candidates
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.electoral_candidates
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.legal_sections
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.criminal_code_sections
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.charter_rights
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.provincial_rights
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.news_articles
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.petitions
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.discussions
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.forum_posts
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.forum_categories
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.forum_subcategories
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.government_services
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.legal_cases
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.polling_sites
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.electoral_districts
    FOR SELECT USING (true);

-- User-generated content - users can read all, but only modify their own
CREATE POLICY "Public read access" ON public.social_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.social_posts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own posts" ON public.social_posts
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own posts" ON public.social_posts
    FOR DELETE USING (auth.uid()::text = user_id);

-- Comments
CREATE POLICY "Public read access" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid()::text = user_id);

-- Social comments
CREATE POLICY "Public read access" ON public.social_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create social comments" ON public.social_comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own social comments" ON public.social_comments
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own social comments" ON public.social_comments
    FOR DELETE USING (auth.uid()::text = user_id);

-- Votes - users can read all, but only create/update their own
CREATE POLICY "Public read access" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON public.votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own votes" ON public.votes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Electoral votes
CREATE POLICY "Public read access" ON public.electoral_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create electoral votes" ON public.electoral_votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own electoral votes" ON public.electoral_votes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- User votes
CREATE POLICY "Users can view own votes" ON public.user_votes
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own votes" ON public.user_votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own votes" ON public.user_votes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Petition signatures
CREATE POLICY "Public read access" ON public.petition_signatures
    FOR SELECT USING (true);

CREATE POLICY "Users can sign petitions" ON public.petition_signatures
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Likes - users can read all, but only create/delete their own
CREATE POLICY "Public read access" ON public.social_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.social_likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike own likes" ON public.social_likes
    FOR DELETE USING (auth.uid()::text = user_id);

-- Comment likes
CREATE POLICY "Public read access" ON public.comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON public.comment_likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike own comment likes" ON public.comment_likes
    FOR DELETE USING (auth.uid()::text = user_id);

-- Forum likes
CREATE POLICY "Public read access" ON public.forum_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like forum posts" ON public.forum_likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike own forum likes" ON public.forum_likes
    FOR DELETE USING (auth.uid()::text = user_id);

-- Discussion likes
CREATE POLICY "Public read access" ON public.discussion_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like discussions" ON public.discussion_likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike own discussion likes" ON public.discussion_likes
    FOR DELETE USING (auth.uid()::text = user_id);

-- Forum reply likes
CREATE POLICY "Public read access" ON public.forum_reply_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like forum replies" ON public.forum_reply_likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can unlike own forum reply likes" ON public.forum_reply_likes
    FOR DELETE USING (auth.uid()::text = user_id);

-- User-specific data - users can only access their own data
CREATE POLICY "Users can view own badges" ON public.user_badges
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own challenges" ON public.user_challenges
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own interactions" ON public.user_interactions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own messages" ON public.user_messages
    FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = recipient_id);

CREATE POLICY "Users can send messages" ON public.user_messages
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own notification preferences" ON public.user_notification_preferences
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.user_notification_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own activity" ON public.user_activity
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own activity" ON public.user_activity
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Friends - users can view their own friendships
CREATE POLICY "Users can view own friends" ON public.user_friends
    FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

CREATE POLICY "Users can add friends" ON public.user_friends
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can remove friends" ON public.user_friends
    FOR DELETE USING (auth.uid()::text = user_id);

-- Notifications - users can only view their own
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Legal search history - users can only view their own
CREATE POLICY "Users can view own search history" ON public.legal_search_history
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own search history" ON public.legal_search_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Sessions - users can only view their own
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sessions" ON public.sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- Forum replies
CREATE POLICY "Public read access" ON public.forum_replies
    FOR SELECT USING (true);

CREATE POLICY "Users can create forum replies" ON public.forum_replies
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own forum replies" ON public.forum_replies
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own forum replies" ON public.forum_replies
    FOR DELETE USING (auth.uid()::text = user_id);

-- Discussion replies
CREATE POLICY "Public read access" ON public.discussion_replies
    FOR SELECT USING (true);

CREATE POLICY "Users can create discussion replies" ON public.discussion_replies
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own discussion replies" ON public.discussion_replies
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own discussion replies" ON public.discussion_replies
    FOR DELETE USING (auth.uid()::text = user_id);

-- Vote counts - public read access
CREATE POLICY "Public read access" ON public.vote_counts
    FOR SELECT USING (true);

-- Civic activities - users can view all, but only create their own
CREATE POLICY "Public read access" ON public.civic_activities
    FOR SELECT USING (true);

CREATE POLICY "Users can create own activities" ON public.civic_activities
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Badges - public read access
CREATE POLICY "Public read access" ON public.badges
    FOR SELECT USING (true);

-- Civic levels - public read access
CREATE POLICY "Public read access" ON public.civic_levels
    FOR SELECT USING (true);

-- Leaderboards - public read access
CREATE POLICY "Public read access" ON public.leaderboards
    FOR SELECT USING (true);

-- Daily challenges - public read access
CREATE POLICY "Public read access" ON public.daily_challenges
    FOR SELECT USING (true);

-- Campaign finance - public read access
CREATE POLICY "Public read access" ON public.campaign_finance
    FOR SELECT USING (true);

-- Politician data - public read access
CREATE POLICY "Public read access" ON public.politician_controversies
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.politician_positions
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.politician_sectors
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.politician_statements
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.politician_truth_tracking
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.politician_parties
    FOR SELECT USING (true);

-- Legal data - public read access
CREATE POLICY "Public read access" ON public.legal_acts
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.law_updates
    FOR SELECT USING (true);

-- News and fact checking - public read access
CREATE POLICY "Public read access" ON public.news_comparisons
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.news_source_credibility
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.fact_checks
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON public.propaganda_detection
    FOR SELECT USING (true);

-- Voting items - public read access
CREATE POLICY "Public read access" ON public.voting_items
    FOR SELECT USING (true);

-- Provincial variations - public read access
CREATE POLICY "Public read access" ON public.provincial_variations
    FOR SELECT USING (true);

-- Candidate policies - public read access
CREATE POLICY "Public read access" ON public.candidate_policies
    FOR SELECT USING (true);

-- Electoral votes - public read access for results, but users can only create their own
CREATE POLICY "Public read access" ON public.electoral_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create own electoral votes" ON public.electoral_votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own electoral votes" ON public.electoral_votes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Add comment to migration
COMMENT ON TABLE public.users IS 'RLS enabled - users can only access their own data';
COMMENT ON TABLE public.social_posts IS 'RLS enabled - public read, authenticated users can create/update own posts';
COMMENT ON TABLE public.votes IS 'RLS enabled - public read, authenticated users can create/update own votes';
COMMENT ON TABLE public.politicians IS 'RLS enabled - public read access only';
COMMENT ON TABLE public.bills IS 'RLS enabled - public read access only';
COMMENT ON TABLE public.elections IS 'RLS enabled - public read access only'; 