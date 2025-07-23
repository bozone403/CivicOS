-- CivicOS Complete Database Schema
-- This includes all tables needed for the full platform functionality

-- Users table (comprehensive)
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
  identity_verification_score DECIMAL(5,2) DEFAULT 0.00,
  residency_verified BOOLEAN DEFAULT FALSE,
  citizenship_status VARCHAR,
  voter_registration_status VARCHAR,
  civic_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  total_badges INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP,
  achievement_tier VARCHAR DEFAULT 'bronze',
  political_awareness_score DECIMAL(5,2) DEFAULT 0.00,
  engagement_level VARCHAR DEFAULT 'newcomer',
  monthly_goal INTEGER DEFAULT 100,
  yearly_goal INTEGER DEFAULT 1200,
  bio TEXT,
  location VARCHAR,
  website VARCHAR,
  social JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Posts table
CREATE TABLE IF NOT EXISTS public.social_posts (
  id SERIAL PRIMARY KEY NOT NULL,
  user_id VARCHAR NOT NULL,
  content TEXT,
  image_url VARCHAR,
  type VARCHAR DEFAULT 'post',
  original_item_id INTEGER,
  original_item_type VARCHAR,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Comments table
CREATE TABLE IF NOT EXISTS public.social_comments (
  id SERIAL PRIMARY KEY NOT NULL,
  post_id INTEGER NOT NULL,
  user_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Likes table
CREATE TABLE IF NOT EXISTS public.social_likes (
  id SERIAL PRIMARY KEY NOT NULL,
  user_id VARCHAR NOT NULL,
  post_id INTEGER,
  comment_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT social_likes_user_id_post_id_comment_id_unique UNIQUE(user_id, post_id, comment_id)
);

-- User Friends table
CREATE TABLE IF NOT EXISTS public.user_friends (
  id SERIAL PRIMARY KEY NOT NULL,
  user_id VARCHAR NOT NULL,
  friend_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT user_friends_user_id_friend_id_unique UNIQUE(user_id, friend_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR DEFAULT 'general',
  priority VARCHAR DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments table (for general commenting on bills, petitions, etc.)
CREATE TABLE IF NOT EXISTS public.comments (
  id SERIAL PRIMARY KEY,
  author_id VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL,
  target_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  edit_count INTEGER DEFAULT 0,
  last_edited_at TIMESTAMP,
  like_count INTEGER DEFAULT 0,
  can_delete BOOLEAN DEFAULT TRUE
);

-- Comment Likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL,
  user_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_comment_like UNIQUE(comment_id, user_id)
);

-- Forum Categories table
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  color VARCHAR DEFAULT '#3B82F6',
  icon VARCHAR DEFAULT 'Building',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Forum Subcategories table
CREATE TABLE IF NOT EXISTS public.forum_subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Forum Posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR NOT NULL,
  category_id INTEGER NOT NULL,
  subcategory_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  is_sticky BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0
);

-- Forum Replies table
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  author_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  parent_reply_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  like_count INTEGER DEFAULT 0
);

-- Forum Likes table
CREATE TABLE IF NOT EXISTS public.forum_likes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  post_id INTEGER,
  reply_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT forum_likes_unique UNIQUE(user_id, post_id, reply_id)
);

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  category VARCHAR,
  rarity VARCHAR DEFAULT 'common',
  points_required INTEGER DEFAULT 0,
  criteria JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT user_achievements_unique UNIQUE(user_id, badge_id)
);

-- User Activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  activity_type VARCHAR NOT NULL,
  details JSONB,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Civic Levels table
CREATE TABLE IF NOT EXISTS public.civic_levels (
  id SERIAL PRIMARY KEY,
  level_name VARCHAR NOT NULL,
  level_number INTEGER NOT NULL,
  points_required INTEGER NOT NULL,
  benefits JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Legal Search History table
CREATE TABLE IF NOT EXISTS public.legal_search_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  search_query VARCHAR NOT NULL,
  results_count INTEGER,
  search_type VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Identity Verifications table
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
  document_verification_score INTEGER,
  overall_score INTEGER,
  verification_method VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE public.social_comments ADD CONSTRAINT social_comments_post_id_fk FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;
ALTER TABLE public.social_comments ADD CONSTRAINT social_comments_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.social_likes ADD CONSTRAINT social_likes_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.social_likes ADD CONSTRAINT social_likes_post_id_fk FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;
ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_friends ADD CONSTRAINT user_friends_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_friends ADD CONSTRAINT user_friends_friend_id_fk FOREIGN KEY (friend_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD CONSTRAINT comments_author_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.comment_likes ADD CONSTRAINT comment_likes_comment_id_fk FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.comment_likes ADD CONSTRAINT comment_likes_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_subcategories ADD CONSTRAINT forum_subcategories_category_id_fk FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON DELETE CASCADE;
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_author_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_category_id_fk FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON DELETE CASCADE;
ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_post_id_fk FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;
ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_author_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_likes ADD CONSTRAINT forum_likes_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_likes ADD CONSTRAINT forum_likes_post_id_fk FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;
ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_badge_id_fk FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;
ALTER TABLE public.user_activity ADD CONSTRAINT user_activity_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.legal_search_history ADD CONSTRAINT legal_search_history_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.identity_verifications ADD CONSTRAINT identity_verifications_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON public.social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON public.social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON public.user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON public.user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_target_type_target_id ON public.comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON public.forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON public.forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);

-- Insert some default data
INSERT INTO public.forum_categories (name, description, color, icon) VALUES
('Politics & Government', 'Discussions about political issues and government policies', '#3B82F6', 'Building'),
('Legal & Rights', 'Legal discussions and rights advocacy', '#10B981', 'Scale'),
('Civic Engagement', 'Community engagement and civic participation', '#F59E0B', 'Users'),
('Transparency & Accountability', 'Government transparency and accountability discussions', '#EF4444', 'Eye'),
('News & Media', 'Current events and media analysis', '#8B5CF6', 'Newspaper')
ON CONFLICT DO NOTHING;

INSERT INTO public.badges (name, description, icon, category, rarity, points_required) VALUES
('First Vote', 'Cast your first vote on a bill', 'Vote', 'voting', 'common', 0),
('Active Citizen', 'Participate in 10 discussions', 'Users', 'engagement', 'common', 100),
('Legal Expert', 'Read 50 legal documents', 'Scale', 'knowledge', 'rare', 500),
('Transparency Advocate', 'Submit 5 FOI requests', 'Eye', 'advocacy', 'epic', 1000),
('Community Leader', 'Help 100 other citizens', 'Crown', 'social', 'legendary', 5000)
ON CONFLICT DO NOTHING;

INSERT INTO public.civic_levels (level_name, level_number, points_required, benefits) VALUES
('Newcomer', 1, 0, '{"description": "Welcome to CivicOS!", "features": ["Basic voting", "Read posts"]}'),
('Active Citizen', 2, 100, '{"description": "You\'re getting involved!", "features": ["Create posts", "Comment on bills"]}'),
('Community Advocate', 3, 500, '{"description": "You\'re making a difference!", "features": ["Create petitions", "Advanced analytics"]}'),
('Civic Expert', 4, 1000, '{"description": "You\'re a civic leader!", "features": ["Moderate discussions", "Access to premium features"]}'),
('Democracy Champion', 5, 5000, '{"description": "You\'re a democracy champion!", "features": ["All platform features", "Priority support"]}')
ON CONFLICT DO NOTHING; 