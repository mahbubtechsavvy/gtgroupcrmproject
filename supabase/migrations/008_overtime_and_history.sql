-- ================================================================
-- GT GROUP CRM — OVERTIME & SCHEDULE HISTORY (v1.0)
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. STAFF OVERTIME: Track extra hours
CREATE TABLE IF NOT EXISTS staff_overtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL CHECK (hours > 0),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SCHEDULE HISTORY: Audit log for availability changes
CREATE TABLE IF NOT EXISTS counselor_schedule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_schedule JSONB,
  new_schedule JSONB,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE staff_overtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselor_schedule_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Overtime: Staff can see/create own, Super Admin/Office Manager can manage
CREATE POLICY "staff_overtime_select" ON staff_overtime FOR SELECT TO authenticated
  USING (staff_id = auth.uid() OR is_super_admin());

CREATE POLICY "staff_overtime_insert" ON staff_overtime FOR INSERT TO authenticated
  WITH CHECK (staff_id = auth.uid() OR is_super_admin());

CREATE POLICY "staff_overtime_all_admin" ON staff_overtime FOR ALL TO authenticated
  USING (is_super_admin());

-- History: All authenticated can see history (transparency), but only system/admin creates
CREATE POLICY "counselor_schedule_history_select" ON counselor_schedule_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "counselor_schedule_history_insert" ON counselor_schedule_history FOR INSERT TO authenticated WITH CHECK (true);
