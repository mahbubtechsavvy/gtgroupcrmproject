# 🔗 CRM → Website Integration Master Plan
## Scalable for 4 Offices × 10,000 Students × 12 Months = 120,000+ Records/Year

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Single Source of Truth)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  CRM Tables  │  │ Website CMS  │  │  Email / Newsletter  │  │
│  │  (students,  │  │  (blog, team,│  │  (subscribers,       │  │
│  │   pipeline,  │  │   events,    │  │   campaigns,         │  │
│  │   payments)  │  │   courses,   │  │   templates)         │  │
│  │              │  │   visa, faq) │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┴──────────────────────┘             │
│                           │                                     │
│              Realtime Subscriptions + RLS Policies              │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────┐                 ┌──────────────────────┐
│  GT CRM (Next)  │                 │ Study Website (Next) │
│  gtgroupcrm..   │  ← Push/API →  │  study-consultancy   │
│                 │                 │                      │
│  ✅ Manage ALL  │                 │  ✅ Display All Data  │
│  website content│                 │  ✅ Realtime updates  │
│  from CRM panel │                 │  ✅ SEO-optimized     │
└─────────────────┘                 └──────────────────────┘
```

### Core Principle
**All data lives in Supabase.** The CRM is the **write interface** (admin panel). The Website is the **read interface** (public display). No separate backend needed — Supabase handles auth, RLS, realtime, and storage.

---

## 2. Scalability Numbers

| Metric | Value | Strategy |
|---|---|---|
| Offices | 4 | `office_id` FK on all tables |
| Students/year | 10,000 | Paginated queries, indexed |
| Files/year | 120,000 | Supabase Storage + CDN |
| Website pages | 26 | ISR (revalidate every 60s) |
| DB rows/year | ~500,000 | Partitioning after 5M rows |
| Concurrent users | 1,000+ | Edge caching + CDN |
| Newsletter sends | 50,000+/month | Batched queue system |

---

## 3. New Database Migrations Required

### Migration 029 — Website CMS Full Schema

```sql
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
  ADD COLUMN IF NOT EXISTS slug            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS event_end_date  DATE,
  ADD COLUMN IF NOT EXISTS capacity        INTEGER,
  ADD COLUMN IF NOT EXISTS registered_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title       TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS created_by      UUID REFERENCES public.users(id);

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
  ADD COLUMN IF NOT EXISTS is_featured      BOOLEAN DEFAULT false,
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.web_destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.web_universities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.web_faqs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.web_partners;
```

---

## 4. RLS Policy Strategy

### Public Read (Website Display)
```sql
-- Anyone can read published content
CREATE POLICY "public_read_destinations" ON web_destinations
  FOR SELECT USING (is_published = true);

CREATE POLICY "public_read_universities" ON web_universities
  FOR SELECT USING (is_published = true);

-- Only CRM staff can write
CREATE POLICY "crm_staff_write" ON web_destinations
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager','counselor'))
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager','counselor'));
```

### Public Write (Forms)
```sql
-- Anyone can submit application
CREATE POLICY "public_insert_applications" ON web_applications
  FOR INSERT WITH CHECK (true);

-- Anyone can book appointment
CREATE POLICY "public_insert_appointments" ON web_appointments
  FOR INSERT WITH CHECK (true);

-- Anyone can enroll in event
CREATE POLICY "public_insert_event_reg" ON event_registrations
  FOR INSERT WITH CHECK (true);
```

### CRM Staff — Full Access
All CRM tables use authenticated + role-based RLS (ceo, coo, it_manager see all offices; counselors see own office only).
