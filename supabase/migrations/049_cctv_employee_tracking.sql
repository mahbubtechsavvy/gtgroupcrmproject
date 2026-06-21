-- ================================================================
-- 049: CCTV EMPLOYEE TRACKING SCHEMA
-- ================================================================

-- Create employee workstations mapping coordinates on CCTV views
CREATE TABLE IF NOT EXISTS cctv_workstations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cctv_device_id UUID REFERENCES cctv_devices(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'South Desk', 'North Desk'
  x_min NUMERIC NOT NULL, -- Normalized coordinates (0.0 to 1.0)
  y_min NUMERIC NOT NULL,
  x_max NUMERIC NOT NULL,
  y_max NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cctv_device_id, employee_id, name)
);

-- Create cctv tracking logs to record employee present/absent status transitions
CREATE TABLE IF NOT EXISTS cctv_tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cctv_device_id UUID REFERENCES cctv_devices(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  logged_at TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE cctv_workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctv_tracking_logs ENABLE ROW LEVEL SECURITY;

-- Workstations Policies
CREATE POLICY "cctv_workstations_select" ON cctv_workstations
  FOR SELECT TO authenticated
  USING (is_super_admin() OR (SELECT office_id FROM users WHERE users.id = cctv_workstations.employee_id)::text = get_my_office_id()::text);

CREATE POLICY "cctv_workstations_manage" ON cctv_workstations
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Tracking Logs Policies
CREATE POLICY "cctv_tracking_logs_select" ON cctv_tracking_logs
  FOR SELECT TO authenticated
  USING (is_super_admin() OR (SELECT office_id FROM users WHERE users.id = cctv_tracking_logs.employee_id)::text = get_my_office_id()::text);

CREATE POLICY "cctv_tracking_logs_insert" ON cctv_tracking_logs
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Allow the microservice or frontend to insert logs

-- Trigger for update_cctv_workstations_updated_at
CREATE TRIGGER update_cctv_workstations_updated_at
  BEFORE UPDATE ON cctv_workstations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
