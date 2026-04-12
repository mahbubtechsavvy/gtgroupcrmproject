-- ================================================================
-- GT GROUP CRM — FINAL HOLISTIC Polish (v1.0)
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. UNIVERSITIES: Add Institution Type
ALTER TABLE universities 
  ADD COLUMN IF NOT EXISTS institution_type TEXT CHECK (institution_type IN ('Public', 'Private', 'Vocational', 'K-PR'));

-- 2. PROGRAMS: Add Department, Detailed Intakes (Deadlines/Start Dates)
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS faculty TEXT,
  ADD COLUMN IF NOT EXISTS deadline_spring TEXT,
  ADD COLUMN IF NOT EXISTS deadline_summer TEXT,
  ADD COLUMN IF NOT EXISTS deadline_autumn TEXT,
  ADD COLUMN IF NOT EXISTS deadline_winter TEXT,
  ADD COLUMN IF NOT EXISTS start_spring TEXT,
  ADD COLUMN IF NOT EXISTS start_summer TEXT,
  ADD COLUMN IF NOT EXISTS start_autumn TEXT,
  ADD COLUMN IF NOT EXISTS start_winter TEXT;

-- 3. APPOINTMENTS: Add Google Sync Fields
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- 4. APP_SETTINGS: Add Master Gmail (Super Admin Only)
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS master_crm_gmail_account TEXT;

-- 5. COUNSELOR AVAILABILITY: Weekly Hours (day 0=Sun, 6=Sat)
CREATE TABLE IF NOT EXISTS counselor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(counselor_id, day_of_week, start_time)
);

-- 6. COUNSELOR VACATIONS: Specific Date Ranges
CREATE TABLE IF NOT EXISTS counselor_vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ENABLE RLS FOR NEW TABLES
ALTER TABLE counselor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselor_vacations ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES: 
-- Counselor can manage own. Super Admin can manage all.
CREATE POLICY "counselor_availability_select" ON counselor_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "counselor_availability_all" ON counselor_availability FOR ALL TO authenticated USING (
  auth.uid() = counselor_id OR (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
);

CREATE POLICY "counselor_vacations_select" ON counselor_vacations FOR SELECT TO authenticated USING (true);
CREATE POLICY "counselor_vacations_all" ON counselor_vacations FOR ALL TO authenticated USING (
  auth.uid() = counselor_id OR (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
);
