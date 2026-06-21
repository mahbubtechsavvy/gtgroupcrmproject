-- GT Group Website Tables
-- 1. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select for approved testimonials" ON testimonials
  FOR SELECT USING (is_approved = true);

-- 2. News/Blog Posts Table
CREATE TABLE IF NOT EXISTS news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for news_posts
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select for published news" ON news_posts
  FOR SELECT USING (is_published = true);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT,
  event_type TEXT,
  is_virtual BOOLEAN DEFAULT false,
  registration_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select for events" ON events
  FOR SELECT USING (true);

-- 4. Website Courses Table
CREATE TABLE IF NOT EXISTS website_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  duration TEXT,
  course_type TEXT NOT NULL,
  instructor_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for website_courses
ALTER TABLE website_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select for active courses" ON website_courses
  FOR SELECT USING (is_active = true);

-- 5. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  office_id UUID REFERENCES offices(id),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select for active team members" ON team_members
  FOR SELECT USING (is_active = true);

-- 6. Payments Table (Demo)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see their own payments" ON payments
  FOR SELECT USING (auth.uid() = student_id);

-- 7. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS for newsletter_subscribers
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- No public select, only insert
CREATE POLICY "Allow public insert for newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);
