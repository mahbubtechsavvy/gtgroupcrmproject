-- 040_website_public_form_guardrails.sql
-- Purpose: anti-spam/rate-limit framework for public form endpoints.
-- Note: DB checks + logging are in place; API routes should call the helper RPCs.

-- ---------------------------------------------------------------------------
-- 1) Submission log table for rate limiting and abuse detection
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.web_form_submissions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL CHECK (
    form_type IN ('application', 'appointment', 'event_registration', 'course_enrollment', 'newsletter')
  ),
  ip_hash TEXT NOT NULL,
  email TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_form_submissions_log_ip_time
  ON public.web_form_submissions_log(ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_web_form_submissions_log_form_time
  ON public.web_form_submissions_log(form_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_web_form_submissions_log_email_time
  ON public.web_form_submissions_log(lower(email), created_at DESC);

ALTER TABLE public.web_form_submissions_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS web_form_submissions_log_no_public_select ON public.web_form_submissions_log;
CREATE POLICY web_form_submissions_log_no_public_select
ON public.web_form_submissions_log
FOR SELECT TO authenticated
USING (public.is_super_role() OR public.current_user_role() = 'it_manager');

DROP POLICY IF EXISTS web_form_submissions_log_service_insert ON public.web_form_submissions_log;
CREATE POLICY web_form_submissions_log_service_insert
ON public.web_form_submissions_log
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2) Disposable email domain blocklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.web_blocked_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.web_blocked_email_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS web_blocked_domains_read_staff ON public.web_blocked_email_domains;
CREATE POLICY web_blocked_domains_read_staff
ON public.web_blocked_email_domains
FOR SELECT TO authenticated
USING (public.is_super_role() OR public.current_user_role() = 'it_manager');

DROP POLICY IF EXISTS web_blocked_domains_manage_staff ON public.web_blocked_email_domains;
CREATE POLICY web_blocked_domains_manage_staff
ON public.web_blocked_email_domains
FOR ALL TO authenticated
USING (public.is_super_role() OR public.current_user_role() = 'it_manager')
WITH CHECK (public.is_super_role() OR public.current_user_role() = 'it_manager');

-- ---------------------------------------------------------------------------
-- 3) Reusable helper functions for API route guardrails
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_blocked_email_domain(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.web_blocked_email_domains d
    WHERE d.is_active = true
      AND lower(d.domain) = split_part(lower(coalesce(p_email, '')), '@', 2)
  );
$$;

CREATE OR REPLACE FUNCTION public.allow_form_submit(
  p_form_type TEXT,
  p_ip_hash TEXT,
  p_window_minutes INTEGER DEFAULT 15,
  p_limit INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < p_limit
  FROM public.web_form_submissions_log
  WHERE form_type = p_form_type
    AND ip_hash = p_ip_hash
    AND created_at > now() - make_interval(mins => p_window_minutes);
$$;

CREATE OR REPLACE FUNCTION public.log_form_submission(
  p_form_type TEXT,
  p_ip_hash TEXT,
  p_email TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.web_form_submissions_log(form_type, ip_hash, email, user_agent, metadata)
  VALUES (p_form_type, p_ip_hash, p_email, p_user_agent, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_blocked_email_domain(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allow_form_submit(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_form_submission(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Optional stricter DB checks for email fields
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'web_applications_email_format_check'
      AND conrelid = 'public.web_applications'::regclass
  ) THEN
    ALTER TABLE public.web_applications
      ADD CONSTRAINT web_applications_email_format_check
      CHECK (position('@' in email) > 1);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'web_appointments_email_format_check'
      AND conrelid = 'public.web_appointments'::regclass
  ) THEN
    ALTER TABLE public.web_appointments
      ADD CONSTRAINT web_appointments_email_format_check
      CHECK (position('@' in email) > 1);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_registrations_email_format_check'
      AND conrelid = 'public.event_registrations'::regclass
  ) THEN
    ALTER TABLE public.event_registrations
      ADD CONSTRAINT event_registrations_email_format_check
      CHECK (position('@' in email) > 1);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'course_enrollments_email_format_check'
      AND conrelid = 'public.course_enrollments'::regclass
  ) THEN
    ALTER TABLE public.course_enrollments
      ADD CONSTRAINT course_enrollments_email_format_check
      CHECK (position('@' in email) > 1);
  END IF;
END $$;

