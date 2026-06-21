-- 038_website_rls_policies.sql
-- Purpose: replace permissive website policies with role-aware, office-scoped RLS.

-- ---------------------------------------------------------------------------
-- 1) Role helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_office_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT office_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('ceo', 'coo', 'it_manager'), false);
$$;

CREATE OR REPLACE FUNCTION public.is_crm_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.current_user_role() IN (
      'ceo',
      'coo',
      'it_manager',
      'office_manager',
      'senior_counselor',
      'counselor',
      'receptionist'
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_office_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_crm_staff() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Ensure RLS is enabled on all website integration tables
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.web_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.web_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.web_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.web_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.web_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.web_legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.web_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.web_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.website_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.testimonials ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3) Drop known permissive/legacy policies
-- ---------------------------------------------------------------------------
-- From 027/028/029 historical migrations.
DROP POLICY IF EXISTS "Allow public insert for testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow public update for testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow public delete for testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow public select for approved testimonials" ON public.testimonials;

DROP POLICY IF EXISTS "Allow public insert for news_posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow public update for news_posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow public delete for news_posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow public select for published news" ON public.news_posts;
DROP POLICY IF EXISTS "Allow public select for all news" ON public.news_posts;

DROP POLICY IF EXISTS "Allow public insert for events" ON public.events;
DROP POLICY IF EXISTS "Allow public update for events" ON public.events;
DROP POLICY IF EXISTS "Allow public delete for events" ON public.events;
DROP POLICY IF EXISTS "Allow public select for events" ON public.events;

DROP POLICY IF EXISTS "Allow public insert for website_courses" ON public.website_courses;
DROP POLICY IF EXISTS "Allow public update for website_courses" ON public.website_courses;
DROP POLICY IF EXISTS "Allow public delete for website_courses" ON public.website_courses;
DROP POLICY IF EXISTS "Allow public select for active courses" ON public.website_courses;
DROP POLICY IF EXISTS "Allow public select for all courses" ON public.website_courses;

DROP POLICY IF EXISTS "Allow public insert for team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public update for team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public delete for team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public select for active team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public select for all team members" ON public.team_members;

DROP POLICY IF EXISTS "Allow public insert for newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public update for newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public delete for newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public select for newsletter_subscribers" ON public.newsletter_subscribers;

DROP POLICY IF EXISTS "public_read_destinations" ON public.web_destinations;
DROP POLICY IF EXISTS "public_read_universities" ON public.web_universities;
DROP POLICY IF EXISTS "public_read_scholarships" ON public.web_scholarships;
DROP POLICY IF EXISTS "public_read_partners" ON public.web_partners;
DROP POLICY IF EXISTS "public_read_faqs" ON public.web_faqs;
DROP POLICY IF EXISTS "public_read_legal" ON public.web_legal_pages;
DROP POLICY IF EXISTS "crm_staff_write_destinations" ON public.web_destinations;
DROP POLICY IF EXISTS "crm_staff_write_universities" ON public.web_universities;
DROP POLICY IF EXISTS "public_insert_applications" ON public.web_applications;
DROP POLICY IF EXISTS "public_insert_appointments" ON public.web_appointments;
DROP POLICY IF EXISTS "public_insert_event_reg" ON public.event_registrations;

-- ---------------------------------------------------------------------------
-- 4) Public read policies (website display)
-- ---------------------------------------------------------------------------
CREATE POLICY web_destinations_public_read ON public.web_destinations
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY web_universities_public_read ON public.web_universities
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY web_scholarships_public_read ON public.web_scholarships
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY web_partners_public_read ON public.web_partners
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY web_faqs_public_read ON public.web_faqs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY web_legal_pages_public_read ON public.web_legal_pages
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY news_posts_public_read ON public.news_posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY events_public_read ON public.events
  FOR SELECT TO anon, authenticated
  USING (COALESCE(is_published, false) = true);

CREATE POLICY website_courses_public_read ON public.website_courses
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY team_members_public_read ON public.team_members
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY testimonials_public_read ON public.testimonials
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);

-- ---------------------------------------------------------------------------
-- 5) CRM read/write policies for content management tables
-- ---------------------------------------------------------------------------
CREATE POLICY web_destinations_crm_all ON public.web_destinations
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY web_universities_crm_all ON public.web_universities
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY web_scholarships_crm_all ON public.web_scholarships
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY web_partners_crm_all ON public.web_partners
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY web_faqs_crm_all ON public.web_faqs
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY web_legal_pages_crm_all ON public.web_legal_pages
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY news_posts_crm_all ON public.news_posts
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY events_crm_all ON public.events
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY website_courses_crm_all ON public.website_courses
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY team_members_crm_all ON public.team_members
  FOR ALL TO authenticated
  USING (
    public.is_super_role()
    OR office_id IS NULL
    OR office_id = public.current_user_office_id()
  )
  WITH CHECK (
    public.is_super_role()
    OR office_id IS NULL
    OR office_id = public.current_user_office_id()
  );

CREATE POLICY testimonials_crm_all ON public.testimonials
  FOR ALL TO authenticated
  USING (
    public.is_super_role()
    OR office_id IS NULL
    OR office_id = public.current_user_office_id()
  )
  WITH CHECK (
    public.is_super_role()
    OR office_id IS NULL
    OR office_id = public.current_user_office_id()
  );

-- ---------------------------------------------------------------------------
-- 6) Public form insert policies (restricted checks, not full-open)
-- ---------------------------------------------------------------------------
CREATE POLICY web_applications_public_insert ON public.web_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(full_name)) >= 2
    AND position('@' in email) > 1
    AND status = 'submitted'
  );

CREATE POLICY web_appointments_public_insert ON public.web_appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(student_name)) >= 2
    AND position('@' in email) > 1
    AND preferred_date >= current_date
    AND status = 'pending'
  );

CREATE POLICY event_registrations_public_insert ON public.event_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name)) >= 2
    AND position('@' in email) > 1
    AND status = 'registered'
  );

CREATE POLICY course_enrollments_public_insert ON public.course_enrollments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name)) >= 2
    AND position('@' in email) > 1
    AND status = 'pending'
  );

CREATE POLICY newsletter_subscribers_public_insert ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    position('@' in email) > 1
    AND COALESCE(is_active, true) = true
  );

-- ---------------------------------------------------------------------------
-- 7) CRM policies for intake tables and campaigns
-- ---------------------------------------------------------------------------
CREATE POLICY web_applications_crm_select_update ON public.web_applications
  FOR SELECT TO authenticated
  USING (
    public.is_super_role()
    OR office_id = public.current_user_office_id()
    OR assigned_counselor = auth.uid()
  );

CREATE POLICY web_applications_crm_modify ON public.web_applications
  FOR UPDATE TO authenticated
  USING (
    public.is_super_role()
    OR office_id = public.current_user_office_id()
    OR assigned_counselor = auth.uid()
  )
  WITH CHECK (
    public.is_super_role()
    OR office_id = public.current_user_office_id()
    OR assigned_counselor = auth.uid()
  );

CREATE POLICY web_appointments_crm_select_update ON public.web_appointments
  FOR SELECT TO authenticated
  USING (
    public.is_super_role()
    OR office_id = public.current_user_office_id()
    OR counselor_id = auth.uid()
  );

CREATE POLICY web_appointments_crm_modify ON public.web_appointments
  FOR UPDATE TO authenticated
  USING (
    public.is_super_role()
    OR office_id = public.current_user_office_id()
    OR counselor_id = auth.uid()
  )
  WITH CHECK (
    public.is_super_role()
    OR office_id = public.current_user_office_id()
    OR counselor_id = auth.uid()
  );

CREATE POLICY event_registrations_crm_all ON public.event_registrations
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY course_enrollments_crm_all ON public.course_enrollments
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY newsletter_subscribers_crm_all ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (public.is_crm_staff())
  WITH CHECK (public.is_crm_staff());

CREATE POLICY newsletter_campaigns_crm_all ON public.newsletter_campaigns
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('ceo', 'coo', 'it_manager', 'office_manager'))
  WITH CHECK (public.current_user_role() IN ('ceo', 'coo', 'it_manager', 'office_manager'));

