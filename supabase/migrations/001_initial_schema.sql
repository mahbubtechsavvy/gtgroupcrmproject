-- ================================================================
-- GT GROUP CRM — FULL DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- Project: kjppkkumublhiwzwufhe
-- ================================================================

-- ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- OFFICES
-- ================================================================
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- USERS (+ Supabase Auth)
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'counselor' CHECK (role IN ('ceo','coo','it_manager','office_manager','senior_counselor','counselor','receptionist')),
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add manager_id FK after users table exists
ALTER TABLE offices ADD CONSTRAINT offices_manager_fk FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- ================================================================
-- ROLE PERMISSIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  feature TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  UNIQUE(role, feature)
);

-- ================================================================
-- DESTINATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL,
  flag_emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- UNIVERSITIES
-- ================================================================
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  city TEXT,
  ranking INTEGER,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- PROGRAMS
-- ================================================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  degree_level TEXT CHECK (degree_level IN ('Bachelor','Master','PhD','Diploma','Language')),
  tuition_fee NUMERIC,
  currency TEXT DEFAULT 'USD',
  duration_years NUMERIC,
  intake_months TEXT[],
  requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- STUDENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  -- Contact
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  -- Academic
  education_level TEXT,
  institution_name TEXT,
  gpa TEXT,
  graduation_year INTEGER,
  ielts_overall NUMERIC,
  ielts_listening NUMERIC,
  ielts_reading NUMERIC,
  ielts_writing NUMERIC,
  ielts_speaking NUMERIC,
  toefl_score INTEGER,
  other_test TEXT,
  other_test_score TEXT,
  -- Study Preferences
  target_destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  target_university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  target_program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  target_course_name TEXT,
  preferred_intake TEXT,
  -- CRM
  lead_source TEXT CHECK (lead_source IN ('Facebook','Instagram','Referral','Walk-in','Website','WhatsApp','LinkedIn','Other')),
  pipeline_status TEXT DEFAULT 'new_lead' CHECK (pipeline_status IN (
    'new_lead','initial_consultation','documents_collecting','application_submitted',
    'offer_received','visa_applied','visa_approved','enrolled','rejected','deferred'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- PIPELINE HISTORY
-- ================================================================
CREATE TABLE IF NOT EXISTS pipeline_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- APPOINTMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- PAYMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_date DATE,
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid','pending','partial','refunded')),
  receipt_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- DOCUMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- INTERACTIONS / NOTES
-- ================================================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('note','call','email','meeting','whatsapp','document','payment','status_change')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

-- ENABLE RLS
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- Helper function: is super admin?
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT get_my_role() IN ('ceo','coo','it_manager')
$$;

-- Helper function: get my office_id
CREATE OR REPLACE FUNCTION get_my_office_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT office_id FROM users WHERE id = auth.uid()
$$;

-- USERS: can see all (needed for dropdowns), update own or super admin
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (is_super_admin() OR id = auth.uid());
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (is_super_admin() OR id = auth.uid());

-- OFFICES
CREATE POLICY "offices_select" ON offices FOR SELECT TO authenticated USING (true);
CREATE POLICY "offices_insert" ON offices FOR INSERT TO authenticated WITH CHECK (is_super_admin());
CREATE POLICY "offices_update" ON offices FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "offices_delete" ON offices FOR DELETE TO authenticated USING (is_super_admin());

-- DESTINATIONS
CREATE POLICY "destinations_select" ON destinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "destinations_insert" ON destinations FOR INSERT TO authenticated WITH CHECK (is_super_admin());
CREATE POLICY "destinations_update" ON destinations FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "destinations_delete" ON destinations FOR DELETE TO authenticated USING (is_super_admin());

-- UNIVERSITIES
CREATE POLICY "universities_select" ON universities FOR SELECT TO authenticated USING (true);
CREATE POLICY "universities_insert" ON universities FOR INSERT TO authenticated WITH CHECK (is_super_admin());
CREATE POLICY "universities_update" ON universities FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "universities_delete" ON universities FOR DELETE TO authenticated USING (is_super_admin());

-- PROGRAMS
CREATE POLICY "programs_select" ON programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "programs_insert" ON programs FOR INSERT TO authenticated WITH CHECK (is_super_admin());
CREATE POLICY "programs_update" ON programs FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "programs_delete" ON programs FOR DELETE TO authenticated USING (is_super_admin());

-- STUDENTS: own office or super admin
CREATE POLICY "students_select" ON students FOR SELECT TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());
CREATE POLICY "students_insert" ON students FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR office_id = get_my_office_id());
CREATE POLICY "students_update" ON students FOR UPDATE TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());
CREATE POLICY "students_delete" ON students FOR DELETE TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());

-- PIPELINE_HISTORY
CREATE POLICY "pipeline_history_select" ON pipeline_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "pipeline_history_insert" ON pipeline_history FOR INSERT TO authenticated WITH CHECK (true);

-- APPOINTMENTS
CREATE POLICY "appointments_select" ON appointments FOR SELECT TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());
CREATE POLICY "appointments_insert" ON appointments FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR office_id = get_my_office_id());
CREATE POLICY "appointments_update" ON appointments FOR UPDATE TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());
CREATE POLICY "appointments_delete" ON appointments FOR DELETE TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());

-- PAYMENTS
CREATE POLICY "payments_select" ON payments FOR SELECT TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());
CREATE POLICY "payments_insert" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_update" ON payments FOR UPDATE TO authenticated WITH CHECK (true);

-- DOCUMENTS
CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (true);

-- INTERACTIONS
CREATE POLICY "interactions_select" ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "interactions_insert" ON interactions FOR INSERT TO authenticated WITH CHECK (true);

-- ROLE_PERMISSIONS
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_manage" ON role_permissions FOR ALL TO authenticated USING (is_super_admin());

-- ================================================================
-- SEED DEFAULT OFFICES
-- ================================================================
INSERT INTO offices (name, country, city) VALUES
  ('GT Group Bangladesh', 'Bangladesh', 'Dhaka'),
  ('GT Group South Korea', 'South Korea', 'Seoul'),
  ('GT Group Sri Lanka', 'Sri Lanka', 'Colombo'),
  ('GT Group Vietnam', 'Vietnam', 'Hanoi')
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED DEFAULT DESTINATIONS
-- ================================================================
INSERT INTO destinations (country_name, flag_emoji, is_active) VALUES
  ('South Korea', '🇰🇷', true),
  ('Japan', '🇯🇵', true),
  ('China', '🇨🇳', true),
  ('USA', '🇺🇸', true),
  ('United Kingdom', '🇬🇧', true),
  ('Australia', '🇦🇺', true),
  ('Germany', '🇩🇪', true),
  ('Finland', '🇫🇮', true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- STORAGE BUCKET FOR STUDENT DOCUMENTS
-- ================================================================
-- Run this separately in Storage settings or via the Supabase dashboard:
-- Create bucket: "student-documents" with public access: false
-- Policy: authenticated users can upload/read from their student folder

-- ================================================================
-- UPDATED_AT TRIGGER FOR STUDENTS
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
