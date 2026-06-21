-- Migration 028: Add INSERT/UPDATE/DELETE policies and enable Realtime for website tables

-- 1. Testimonials Policies
CREATE POLICY "Allow public insert for testimonials" ON testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for testimonials" ON testimonials FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for testimonials" ON testimonials FOR DELETE USING (true);

-- 2. News/Blog Posts Policies
CREATE POLICY "Allow public insert for news_posts" ON news_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for news_posts" ON news_posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for news_posts" ON news_posts FOR DELETE USING (true);

-- Also allow selecting all news posts for the CRM interface (previously was only published)
DROP POLICY IF EXISTS "Allow public select for published news" ON news_posts;
CREATE POLICY "Allow public select for all news" ON news_posts FOR SELECT USING (true);

-- 3. Events Policies
CREATE POLICY "Allow public insert for events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for events" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for events" ON events FOR DELETE USING (true);

-- 4. Website Courses Policies
CREATE POLICY "Allow public insert for website_courses" ON website_courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for website_courses" ON website_courses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for website_courses" ON website_courses FOR DELETE USING (true);

-- Also allow selecting all courses for the CRM interface (previously was only active)
DROP POLICY IF EXISTS "Allow public select for active courses" ON website_courses;
CREATE POLICY "Allow public select for all courses" ON website_courses FOR SELECT USING (true);

-- 5. Team Members Policies
CREATE POLICY "Allow public insert for team_members" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for team_members" ON team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for team_members" ON team_members FOR DELETE USING (true);

-- Also allow selecting all team members for the CRM interface (previously was only active)
DROP POLICY IF EXISTS "Allow public select for active team members" ON team_members;
CREATE POLICY "Allow public select for all team members" ON team_members FOR SELECT USING (true);

-- 6. Newsletter Subscribers Policies
-- (INSERT policy already exists from 027)
CREATE POLICY "Allow public update for newsletter_subscribers" ON newsletter_subscribers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for newsletter_subscribers" ON newsletter_subscribers FOR DELETE USING (true);
CREATE POLICY "Allow public select for newsletter_subscribers" ON newsletter_subscribers FOR SELECT USING (true);

-- Realtime Setup: Enable Realtime for all website content tables
-- Create the publication if it doesn't exist (Supabase creates it by default, but just in case)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Safely add tables to the publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'testimonials') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE testimonials;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'news_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE news_posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'website_courses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE website_courses;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'team_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'newsletter_subscribers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE newsletter_subscribers;
  END IF;
END $$;
