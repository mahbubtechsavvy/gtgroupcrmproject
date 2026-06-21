-- 037_website_cms_schema_hardening.sql
-- Purpose: harden website CMS schema for consistency, integrity, and scale.

-- ---------------------------------------------------------------------------
-- 1) Shared trigger for updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) Ensure mutable tables have updated_at + update triggers
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.web_destinations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.web_universities
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.web_scholarships
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.events
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.event_registrations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.course_enrollments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.web_appointments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS trg_web_destinations_set_updated_at ON public.web_destinations;
CREATE TRIGGER trg_web_destinations_set_updated_at
BEFORE UPDATE ON public.web_destinations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_web_universities_set_updated_at ON public.web_universities;
CREATE TRIGGER trg_web_universities_set_updated_at
BEFORE UPDATE ON public.web_universities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_web_scholarships_set_updated_at ON public.web_scholarships;
CREATE TRIGGER trg_web_scholarships_set_updated_at
BEFORE UPDATE ON public.web_scholarships
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_news_posts_set_updated_at ON public.news_posts;
CREATE TRIGGER trg_news_posts_set_updated_at
BEFORE UPDATE ON public.news_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_events_set_updated_at ON public.events;
CREATE TRIGGER trg_events_set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_website_courses_set_updated_at ON public.website_courses;
CREATE TRIGGER trg_website_courses_set_updated_at
BEFORE UPDATE ON public.website_courses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_team_members_set_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_set_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_testimonials_set_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_set_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_web_faqs_set_updated_at ON public.web_faqs;
CREATE TRIGGER trg_web_faqs_set_updated_at
BEFORE UPDATE ON public.web_faqs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_web_appointments_set_updated_at ON public.web_appointments;
CREATE TRIGGER trg_web_appointments_set_updated_at
BEFORE UPDATE ON public.web_appointments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_web_applications_set_updated_at ON public.web_applications;
CREATE TRIGGER trg_web_applications_set_updated_at
BEFORE UPDATE ON public.web_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_newsletter_campaigns_set_updated_at ON public.newsletter_campaigns;
CREATE TRIGGER trg_newsletter_campaigns_set_updated_at
BEFORE UPDATE ON public.newsletter_campaigns
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_web_legal_pages_set_updated_at ON public.web_legal_pages;
CREATE TRIGGER trg_web_legal_pages_set_updated_at
BEFORE UPDATE ON public.web_legal_pages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_event_registrations_set_updated_at ON public.event_registrations;
CREATE TRIGGER trg_event_registrations_set_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_course_enrollments_set_updated_at ON public.course_enrollments;
CREATE TRIGGER trg_course_enrollments_set_updated_at
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Data-quality constraints for statuses and ranges
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_registrations_status_check'
      AND conrelid = 'public.event_registrations'::regclass
  ) THEN
    ALTER TABLE public.event_registrations
      ADD CONSTRAINT event_registrations_status_check
      CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'course_enrollments_status_check'
      AND conrelid = 'public.course_enrollments'::regclass
  ) THEN
    ALTER TABLE public.course_enrollments
      ADD CONSTRAINT course_enrollments_status_check
      CHECK (status IN ('pending', 'approved', 'enrolled', 'rejected', 'cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'web_appointments_status_check'
      AND conrelid = 'public.web_appointments'::regclass
  ) THEN
    ALTER TABLE public.web_appointments
      ADD CONSTRAINT web_appointments_status_check
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'web_applications_status_check'
      AND conrelid = 'public.web_applications'::regclass
  ) THEN
    ALTER TABLE public.web_applications
      ADD CONSTRAINT web_applications_status_check
      CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'accepted', 'rejected', 'converted'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'newsletter_campaigns_status_check'
      AND conrelid = 'public.newsletter_campaigns'::regclass
  ) THEN
    ALTER TABLE public.newsletter_campaigns
      ADD CONSTRAINT newsletter_campaigns_status_check
      CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'web_universities_tuition_range_check'
      AND conrelid = 'public.web_universities'::regclass
  ) THEN
    ALTER TABLE public.web_universities
      ADD CONSTRAINT web_universities_tuition_range_check
      CHECK (
        tuition_min IS NULL
        OR tuition_max IS NULL
        OR tuition_min <= tuition_max
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'web_destinations_living_cost_range_check'
      AND conrelid = 'public.web_destinations'::regclass
  ) THEN
    ALTER TABLE public.web_destinations
      ADD CONSTRAINT web_destinations_living_cost_range_check
      CHECK (
        living_cost_min IS NULL
        OR living_cost_max IS NULL
        OR living_cost_min <= living_cost_max
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Idempotent uniqueness and performance indexes
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_event_email
  ON public.event_registrations(event_id, lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_course_enrollments_course_email
  ON public.course_enrollments(course_id, lower(email));

CREATE INDEX IF NOT EXISTS idx_web_applications_office_status_created
  ON public.web_applications(office_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_web_appointments_office_status_date
  ON public.web_appointments(office_id, status, preferred_date DESC);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status
  ON public.event_registrations(event_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_status
  ON public.course_enrollments(course_id, status, enrolled_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status_scheduled
  ON public.newsletter_campaigns(status, scheduled_at);

-- ---------------------------------------------------------------------------
-- 5) Public form metadata columns (for upcoming anti-spam guardrails)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.web_applications
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE IF EXISTS public.web_appointments
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE IF EXISTS public.event_registrations
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE IF EXISTS public.course_enrollments
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

