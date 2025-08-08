-- Enable RLS and add basic policies (adjust for Supabase roles)

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_owner_select ON notifications;
CREATE POLICY notifications_owner_select ON notifications
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'id');
DROP POLICY IF EXISTS notifications_owner_modify ON notifications;
CREATE POLICY notifications_owner_modify ON notifications
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'id');

ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_messages_owner_select ON user_messages;
CREATE POLICY user_messages_owner_select ON user_messages
  FOR SELECT USING (
    sender_id = current_setting('request.jwt.claims', true)::jsonb->>'id'
    OR recipient_id = current_setting('request.jwt.claims', true)::jsonb->>'id'
  );
DROP POLICY IF EXISTS user_messages_owner_insert ON user_messages;
CREATE POLICY user_messages_owner_insert ON user_messages
  FOR INSERT WITH CHECK (sender_id = current_setting('request.jwt.claims', true)::jsonb->>'id');

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_follows_owner_select ON user_follows;
CREATE POLICY user_follows_owner_select ON user_follows
  FOR SELECT USING (
    user_id = current_setting('request.jwt.claims', true)::jsonb->>'id'
    OR follow_id = current_setting('request.jwt.claims', true)::jsonb->>'id'
  );
DROP POLICY IF EXISTS user_follows_owner_modify ON user_follows;
CREATE POLICY user_follows_owner_modify ON user_follows
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'id');

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS votes_owner_select ON votes;
CREATE POLICY votes_owner_select ON votes
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'id');
DROP POLICY IF EXISTS votes_owner_insert ON votes;
CREATE POLICY votes_owner_insert ON votes
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::jsonb->>'id');

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS news_articles_public_select ON news_articles;
CREATE POLICY news_articles_public_select ON news_articles
  FOR SELECT USING (published_at IS NOT NULL);


