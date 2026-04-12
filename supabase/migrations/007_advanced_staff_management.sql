-- ================================================================
-- GT GROUP CRM — ADVANCED STAFF MANAGEMENT (v1.1)
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. VACATION ENHANCEMENTS: Add status (Pending, Approved, Rejected)
ALTER TABLE counselor_vacations 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'));

-- 2. OFFICE HOLIDAYS: Manage country/office based public holidays
CREATE TABLE IF NOT EXISTS office_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  is_government BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STAFF TASKS (TO-DO): Daily/Weekly tasks
CREATE TABLE IF NOT EXISTS staff_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  priority TEXT CHECK (priority IN ('normal','high')), -- High will show with '*'
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. IN-APP NOTIFICATIONS: CRM Alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE RLS
ALTER TABLE office_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- Holidays: All authenticated can see, Super Admin can manage
CREATE POLICY "office_holidays_select" ON office_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_holidays_all" ON office_holidays FOR ALL TO authenticated USING (is_super_admin());

-- Staff Tasks: User can manage own, Admin can see all and manage all
CREATE POLICY "staff_tasks_select" ON staff_tasks FOR SELECT TO authenticated
  USING (staff_id = auth.uid() OR is_super_admin());
CREATE POLICY "staff_tasks_all" ON staff_tasks FOR ALL TO authenticated
  USING (staff_id = auth.uid() OR is_super_admin() OR created_by = auth.uid());

-- Notifications: User can see/update own, Admin can create for any
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

-- 7. SEED INITIAL HOLIDAYS (Example for 2026 Bangladesh/S.Korea)
INSERT INTO office_holidays (country, holiday_date, name) VALUES
  ('Bangladesh', '2026-02-21', 'Language Martyrs Day'),
  ('Bangladesh', '2026-03-26', 'Independence Day'),
  ('South Korea', '2026-03-01', 'Independence Movement Day'),
  ('South Korea', '2026-05-05', 'Children Day')
ON CONFLICT DO NOTHING;
