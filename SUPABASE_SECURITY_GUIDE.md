# 🔒 CivicOS Supabase Security Implementation Guide

## Overview

This guide addresses all Supabase security linter warnings by implementing Row Level Security (RLS) on all public tables. The implementation follows security best practices while maintaining the functionality of the CivicOS platform.

## 🚨 Security Issues Addressed

The following 67 tables had RLS disabled, which posed security risks:

### Government Data Tables (Public Read Access)
- `politicians` - Politician information
- `bills` - Legislative bills
- `elections` - Election data
- `candidates` - Electoral candidates
- `electoral_candidates` - Electoral candidate details
- `legal_sections` - Legal code sections
- `criminal_code_sections` - Criminal code sections
- `charter_rights` - Charter of Rights
- `provincial_rights` - Provincial rights
- `news_articles` - News articles
- `petitions` - Public petitions
- `discussions` - Public discussions
- `forum_posts` - Forum posts
- `forum_categories` - Forum categories
- `forum_subcategories` - Forum subcategories
- `government_services` - Government services
- `legal_cases` - Legal cases
- `polling_sites` - Polling locations
- `electoral_districts` - Electoral districts
- `campaign_finance` - Campaign finance data
- `civic_levels` - Civic engagement levels
- `leaderboards` - User leaderboards
- `daily_challenges` - Daily civic challenges
- `badges` - Achievement badges
- `civic_activities` - Civic activities
- `vote_counts` - Vote statistics
- `voting_items` - Voting items
- `politician_controversies` - Politician controversies
- `politician_positions` - Politician positions
- `politician_sectors` - Politician sectors
- `politician_statements` - Politician statements
- `politician_truth_tracking` - Truth tracking
- `politician_parties` - Political parties
- `legal_acts` - Legal acts
- `law_updates` - Law updates
- `news_comparisons` - News comparisons
- `news_source_credibility` - News source credibility
- `fact_checks` - Fact checking data
- `propaganda_detection` - Propaganda detection
- `provincial_variations` - Provincial variations
- `candidate_policies` - Candidate policies

### User-Generated Content (Public Read, Authenticated Write)
- `social_posts` - Social media posts
- `comments` - Comments on various content
- `social_comments` - Social media comments
- `votes` - User votes on bills/items
- `electoral_votes` - Electoral votes
- `petition_signatures` - Petition signatures
- `social_likes` - Social media likes
- `comment_likes` - Comment likes
- `forum_likes` - Forum post likes
- `discussion_likes` - Discussion likes
- `forum_reply_likes` - Forum reply likes
- `forum_replies` - Forum replies
- `discussion_replies` - Discussion replies

### User-Specific Data (Private Access)
- `users` - User profiles
- `user_votes` - User voting history
- `user_badges` - User badges
- `user_challenges` - User challenges
- `user_interactions` - User interactions
- `user_messages` - User messages
- `user_notification_preferences` - Notification preferences
- `user_achievements` - User achievements
- `user_activity` - User activity
- `user_friends` - User friendships
- `notifications` - User notifications
- `legal_search_history` - Legal search history
- `sessions` - User sessions

## 🔐 Security Policies Implemented

### 1. Public Read Access (Government Data)
```sql
CREATE POLICY "Public read access" ON public.politicians
    FOR SELECT USING (true);
```
**Applies to**: All government data tables
**Purpose**: Allow public access to government information for transparency

### 2. User-Specific Access (Personal Data)
```sql
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);
```
**Applies to**: User profiles, notifications, messages, activity
**Purpose**: Users can only access their own personal data

### 3. User-Generated Content (Public Read, Authenticated Write)
```sql
CREATE POLICY "Public read access" ON public.social_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.social_posts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own posts" ON public.social_posts
    FOR UPDATE USING (auth.uid()::text = user_id);
```
**Applies to**: Social posts, comments, votes, likes
**Purpose**: Public can read content, authenticated users can create/update their own

### 4. Voting System (Public Read, Authenticated Write)
```sql
CREATE POLICY "Public read access" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON public.votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```
**Applies to**: Votes, electoral votes, petition signatures
**Purpose**: Public can see voting results, users can only create their own votes

## 🚀 How to Apply the Migration

### Option 1: Using the Script
```bash
# Set your Supabase database URL
export DATABASE_URL="postgresql://username:password@host:port/database"

# Run the migration script
./apply-rls-migration.sh
```

### Option 2: Manual Application
```bash
# Connect to your Supabase database
psql "postgresql://username:password@host:port/database"

# Apply the migration
\i migrations/0008_enable_rls_security.sql
```

### Option 3: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/0008_enable_rls_security.sql`
4. Execute the migration

## ✅ Verification

After applying the migration, verify that:

1. **All tables have RLS enabled**:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

2. **Policies are created**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

3. **Supabase linter warnings are resolved**:
- Check your Supabase project dashboard
- All "RLS Disabled in Public" warnings should be gone

## 🔧 Customization

### Adding New Tables
When adding new tables, ensure RLS is enabled:

```sql
-- Enable RLS on new table
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Add appropriate policies
CREATE POLICY "Public read access" ON public.new_table
    FOR SELECT USING (true);
```

### Modifying Policies
To modify existing policies:

```sql
-- Drop existing policy
DROP POLICY "Policy Name" ON public.table_name;

-- Create new policy
CREATE POLICY "New Policy Name" ON public.table_name
    FOR SELECT USING (your_condition);
```

## 🛡️ Security Benefits

1. **Data Protection**: Users can only access their own personal data
2. **Public Transparency**: Government data remains publicly accessible
3. **Content Integrity**: Users can only modify their own content
4. **Voting Security**: Users can only create their own votes
5. **Compliance**: Meets Supabase security requirements

## 🚨 Important Notes

1. **Authentication Required**: Some features now require user authentication
2. **API Changes**: Backend APIs may need updates to handle RLS
3. **Testing**: Thoroughly test all features after applying RLS
4. **Backup**: Always backup your database before applying migrations

## 📞 Support

If you encounter issues:

1. Check the Supabase logs for policy violations
2. Verify authentication is working correctly
3. Test with authenticated and unauthenticated users
4. Review the specific policy that's causing issues

## 🔄 Rollback

If you need to rollback the RLS implementation:

```sql
-- Disable RLS on all tables (NOT RECOMMENDED for production)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- Repeat for all tables
```

**Warning**: Rolling back RLS removes security protections. Only do this in development.

---

**Last Updated**: July 26, 2025
**Version**: 1.0.0
**Status**: Ready for Production 