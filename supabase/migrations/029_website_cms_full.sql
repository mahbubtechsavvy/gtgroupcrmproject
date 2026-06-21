-- 029_website_cms_full.sql

-- ══════════════════════════════════════
-- 1. DESTINATIONS (Study Countries)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_destinations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  flag_url        TEXT,
  hero_image_url  TEXT,
  description     TEXT,
  overview_html   TEXT,          -- Rich text editor content
  why_study_here  TEXT,
  living_cost_min NUMERIC,
  living_cost_max NUMERIC,
  currency        TEXT DEFAULT 'USD',
  popular_cities  TEXT[],        -- Array: ['Seoul','Busan','Incheon']
  popular_programs TEXT[],
  visa_overview   TEXT,
  requirements    JSONB,         -- Flexible key-value
  scholarships_available BOOLEAN DEFAULT true,
  is_published    BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  sort_order      INTEGER DEFAULT 0,
  seo_title       TEXT,
  seo_description TEXT,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_destinations ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 2. UNIVERSITIES
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_universities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID REFERENCES public.web_destinations(id),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  cover_image_url TEXT,
  ranking         INTEGER,
  tuition_min     NUMERIC,
  tuition_max     NUMERIC,
  currency        TEXT DEFAULT 'USD',
  programs        TEXT[],
  website_url     TEXT,
  description     TEXT,
  content_html    TEXT,
  is_partner      BOOLEAN DEFAULT false,
  is_published    BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  seo_title       TEXT,
  seo_description TEXT,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_universities ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 3. SCHOLARSHIPS
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_scholarships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id   UUID REFERENCES public.web_universities(id),
  destination_id  UUID REFERENCES public.web_destinations(id),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  amount_min      NUMERIC,
  amount_max      NUMERIC,
  currency        TEXT DEFAULT 'USD',
  deadline        DATE,
  eligibility     TEXT,
  description     TEXT,
  apply_url       TEXT,
  is_published    BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_scholarships ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 4. ENHANCED TEAM MEMBERS
-- ══════════════════════════════════════
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS slug         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp     TEXT,
  ADD COLUMN IF NOT EXISTS sort_order   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title    TEXT,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- ══════════════════════════════════════
-- 5. ENHANCED BLOG / NEWS POSTS
-- ══════════════════════════════════════
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS author_id       UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS author_name     TEXT,
  ADD COLUMN IF NOT EXISTS author_photo    TEXT,
  ADD COLUMN IF NOT EXISTS tags            TEXT[],
  ADD COLUMN IF NOT EXISTS read_time_min   INTEGER,
  ADD COLUMN IF NOT EXISTS destination_id  UUID REFERENCES public.web_destinations(id),
  ADD COLUMN IF NOT EXISTS view_count      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title       TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url    TEXT;

-- ══════════════════════════════════════
-- 6. ENHANCED EVENTS
-- ══════════════════════════════════════
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_date      DATE, -- Added to fix collision with migration 020
  ADD COLUMN IF NOT EXISTS event_time      TEXT,
  ADD COLUMN IF NOT EXISTS slug            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS event_end_date  DATE,
  ADD COLUMN IF NOT EXISTS capacity        INTEGER,
  ADD COLUMN IF NOT EXISTS registered_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title       TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS created_by_staff UUID REFERENCES public.users(id); -- renamed to avoid collision with 020 created_by

-- ══════════════════════════════════════
-- 7. EVENT REGISTRATIONS
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  country     TEXT,
  notes       TEXT,
  status      TEXT DEFAULT 'registered',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 8. ENHANCED COURSES
-- ══════════════════════════════════════
ALTER TABLE public.website_courses
  ADD COLUMN IF NOT EXISTS slug            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS syllabus_html   TEXT,
  ADD COLUMN IF NOT EXISTS schedule_html   TEXT,
  ADD COLUMN IF NOT EXISTS max_students    INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS enrolled_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level           TEXT,
  ADD COLUMN IF NOT EXISTS language        TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS is_featured     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title       TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

-- ══════════════════════════════════════
-- 9. COURSE ENROLLMENTS
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID REFERENCES public.website_courses(id),
  student_id  UUID REFERENCES public.students(id),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  status      TEXT DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 10. ENHANCED TESTIMONIALS
-- ══════════════════════════════════════
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS student_name     TEXT,
  ADD COLUMN IF NOT EXISTS student_photo    TEXT,
  ADD COLUMN IF NOT EXISTS destination      TEXT,
  ADD COLUMN IF NOT EXISTS university_name  TEXT,
  ADD COLUMN IF NOT EXISTS program          TEXT,
  ADD COLUMN IF NOT EXISTS video_url        TEXT,
  ADD COLUMN IF NOT EXISTS office_id        UUID REFERENCES public.offices(id),
  ADD COLUMN IF NOT EXISTS year             INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now();

-- ══════════════════════════════════════
-- 11. PARTNER UNIVERSITIES (Public Logo Grid)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_partners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  logo_url    TEXT,
  country     TEXT,
  website_url TEXT,
  tier        TEXT DEFAULT 'standard',
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_by  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_partners ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 12. FAQ
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_faqs ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 13. OFFICE INFO (Public)
-- ══════════════════════════════════════
ALTER TABLE public.offices
  ADD COLUMN IF NOT EXISTS slug           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS photo_url      TEXT,
  ADD COLUMN IF NOT EXISTS map_embed_url  TEXT,
  ADD COLUMN IF NOT EXISTS working_hours  TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp       TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url   TEXT,
  ADD COLUMN IF NOT EXISTS is_published   BOOLEAN DEFAULT true;

-- ══════════════════════════════════════
-- 14. WEBSITE APPOINTMENTS (Public)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id     UUID REFERENCES public.offices(id),
  student_name  TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TEXT,
  topic         TEXT,
  status        TEXT DEFAULT 'pending',
  counselor_id  UUID REFERENCES public.users(id),
  notes         TEXT,
  source        TEXT DEFAULT 'website',
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_appointments ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 15. ONLINE APPLICATIONS
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id       TEXT UNIQUE DEFAULT 'GT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  -- Personal Info
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  nationality       TEXT,
  passport_number   TEXT,
  date_of_birth     DATE,
  -- Education
  highest_degree    TEXT,
  gpa               NUMERIC,
  institution_name  TEXT,
  -- Preferences
  destination_id    UUID REFERENCES public.web_destinations(id),
  program_interest  TEXT,
  intake_year       INTEGER,
  intake_month      TEXT,
  -- Scores
  ielts_score       NUMERIC,
  topik_level       INTEGER,
  other_scores      JSONB,
  -- Status
  status            TEXT DEFAULT 'submitted',
  assigned_counselor UUID REFERENCES public.users(id),
  office_id         UUID REFERENCES public.offices(id),
  notes             TEXT,
  source            TEXT DEFAULT 'website',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_applications ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 16. NEWSLETTER CAMPAIGNS
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          TEXT NOT NULL,
  preview_text     TEXT,
  body_html        TEXT NOT NULL,
  status           TEXT DEFAULT 'draft',
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  recipient_count  INTEGER DEFAULT 0,
  open_count       INTEGER DEFAULT 0,
  click_count      INTEGER DEFAULT 0,
  target_segment   TEXT DEFAULT 'all',
  created_by       UUID REFERENCES public.users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 17. PRIVACY & TERMS (CMS Managed)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.web_legal_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type    TEXT UNIQUE NOT NULL, -- 'privacy_policy' | 'terms_of_service'
  title        TEXT NOT NULL,
  content_html TEXT NOT NULL,
  version      TEXT DEFAULT '1.0',
  effective_date DATE,
  updated_by   UUID REFERENCES public.users(id),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_legal_pages ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════
-- 18. INDEXES FOR PERFORMANCE
-- ══════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_web_destinations_slug    ON public.web_destinations(slug);
CREATE INDEX IF NOT EXISTS idx_web_universities_slug    ON public.web_universities(slug);
CREATE INDEX IF NOT EXISTS idx_web_universities_dest    ON public.web_universities(destination_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_slug          ON public.news_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_posts_published     ON public.news_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date              ON public.events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_web_faqs_category        ON public.web_faqs(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_web_applications_tracking ON public.web_applications(tracking_id);
CREATE INDEX IF NOT EXISTS idx_web_appointments_office  ON public.web_appointments(office_id, preferred_date);
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_email     ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured    ON public.testimonials(is_featured, is_approved);

-- ══════════════════════════════════════
-- 19. REALTIME ENABLE (Website reads)
-- ══════════════════════════════════════
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.web_destinations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.web_universities;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.news_posts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.website_courses;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.web_faqs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.web_partners;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ══════════════════════════════════════
-- 20. RLS POLICIES
-- ══════════════════════════════════════

-- Public Read (Website Display)
DROP POLICY IF EXISTS "public_read_destinations" ON public.web_destinations;
CREATE POLICY "public_read_destinations" ON public.web_destinations
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "public_read_universities" ON public.web_universities;
CREATE POLICY "public_read_universities" ON public.web_universities
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "public_read_scholarships" ON public.web_scholarships;
CREATE POLICY "public_read_scholarships" ON public.web_scholarships
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "public_read_partners" ON public.web_partners;
CREATE POLICY "public_read_partners" ON public.web_partners
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "public_read_faqs" ON public.web_faqs;
CREATE POLICY "public_read_faqs" ON public.web_faqs
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "public_read_legal" ON public.web_legal_pages;
CREATE POLICY "public_read_legal" ON public.web_legal_pages
  FOR SELECT USING (true);

-- Only CRM staff can write
DROP POLICY IF EXISTS "crm_staff_write_destinations" ON public.web_destinations;
CREATE POLICY "crm_staff_write_destinations" ON public.web_destinations
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager','counselor'))
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager','counselor'));

DROP POLICY IF EXISTS "crm_staff_write_universities" ON public.web_universities;
CREATE POLICY "crm_staff_write_universities" ON public.web_universities
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager','counselor'))
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager','counselor'));

-- Public Write (Forms)
DROP POLICY IF EXISTS "public_insert_applications" ON public.web_applications;
CREATE POLICY "public_insert_applications" ON public.web_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_appointments" ON public.web_appointments;
CREATE POLICY "public_insert_appointments" ON public.web_appointments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_event_reg" ON public.event_registrations;
CREATE POLICY "public_insert_event_reg" ON public.event_registrations
  FOR INSERT WITH CHECK (true);
