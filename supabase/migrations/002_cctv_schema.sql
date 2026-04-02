-- ================================================================
-- CCTV DEVICES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS cctv_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  port INTEGER DEFAULT 554,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- This will be stored ENCRYPTED from the backend
  channel INTEGER DEFAULT 1,
  subtype INTEGER DEFAULT 1, -- 0 for HD, 1 for SD/Substream
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE cctv_devices ENABLE ROW LEVEL SECURITY;

-- Helper function: is super admin? (Already defined in 001_initial_schema.sql)
-- We'll reuse it here.

-- POLICY: Only super admins (CEO, COO, IT Manager) can view, insert, update, or delete CCTV devices.
CREATE POLICY "cctv_devices_all_access" ON cctv_devices
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ================================================================
-- UPDATED_AT TRIGGER
-- ================================================================

CREATE TRIGGER update_cctv_devices_updated_at
  BEFORE UPDATE ON cctv_devices
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
