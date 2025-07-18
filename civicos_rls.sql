-- Comprehensive RLS Fix for CivicOS Database
-- This script will clean up all existing policies and create new ones

create table if not exists public.test_table (
  id serial primary key,
  name text
);

-- Step 1: Drop ALL existing policies from all tables
DROP POLICY IF EXISTS "Allow public read access to badges" ON badges;
DROP POLICY IF EXISTS "Allow public read access to bills" ON bills;
DROP POLICY IF EXISTS "Allow public read access to discussions" ON discussions;
DROP POLICY IF EXISTS "Allow public read access to elections" ON elections;
DROP POLICY IF EXISTS "Allow public read access to notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public read access to petitions" ON petitions;
DROP POLICY IF EXISTS "Allow public read access to politicians" ON politicians;
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public read access to votes" ON votes;

-- Also drop any other potential policy names that might exist
DROP POLICY IF EXISTS "Enable read access for all users" ON badges;
DROP POLICY IF EXISTS "Enable read access for all users" ON bills;
DROP POLICY IF EXISTS "Enable read access for all users" ON discussions;
DROP POLICY IF EXISTS "Enable read access for all users" ON elections;
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON petitions;
DROP POLICY IF EXISTS "Enable read access for all users" ON politicians;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON votes;

-- Step 2: Enable RLS on all tables
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new policies for public read access
CREATE POLICY "Enable read access for all users" ON badges FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON bills FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON discussions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON elections FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON petitions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON politicians FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON votes FOR SELECT USING (true);

-- Step 4: Create policies for authenticated users to insert/update their own data
CREATE POLICY "Enable insert for authenticated users" ON votes FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for users based on user_id" ON votes FOR UPDATE USING ((select auth.uid())::text = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON votes FOR DELETE USING ((select auth.uid())::text = user_id);

CREATE POLICY "Enable insert for authenticated users" ON petitions FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for users based on user_id" ON petitions FOR UPDATE USING ((select auth.uid())::text = creator_id);
CREATE POLICY "Enable delete for users based on user_id" ON petitions FOR DELETE USING ((select auth.uid())::text = creator_id);

CREATE POLICY "Enable insert for authenticated users" ON discussions FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for users based on user_id" ON discussions FOR UPDATE USING ((select auth.uid())::text = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON discussions FOR DELETE USING ((select auth.uid())::text = user_id);

CREATE POLICY "Enable insert for authenticated users" ON notifications FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for users based on user_id" ON notifications FOR UPDATE USING ((select auth.uid())::text = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON notifications FOR DELETE USING ((select auth.uid())::text = user_id);

-- Step 5: Create policies for users table (users can only see their own data)
CREATE POLICY "Enable read access for users based on user_id" ON users FOR SELECT USING ((select auth.uid())::text = id);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for users based on user_id" ON users FOR UPDATE USING ((select auth.uid())::text = id);
CREATE POLICY "Enable delete for users based on user_id" ON users FOR DELETE USING ((select auth.uid())::text = id);

-- Step 6: Create policies for public data (read-only for everyone, insert/update for authenticated)
CREATE POLICY "Enable insert for authenticated users" ON bills FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for authenticated users" ON bills FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable delete for authenticated users" ON bills FOR DELETE USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON elections FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for authenticated users" ON elections FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable delete for authenticated users" ON elections FOR DELETE USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON politicians FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for authenticated users" ON politicians FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable delete for authenticated users" ON politicians FOR DELETE USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON badges FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable update for authenticated users" ON badges FOR UPDATE USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Enable delete for authenticated users" ON badges FOR DELETE USING ((select auth.uid()) IS NOT NULL);

-- Success message
SELECT 'RLS has been successfully enabled on all tables with appropriate policies created.' as status; 