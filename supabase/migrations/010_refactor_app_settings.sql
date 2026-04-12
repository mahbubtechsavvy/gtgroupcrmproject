-- ================================================================
-- 010_refactor_app_settings.sql
-- Run this in your Supabase SQL Editor to fix the Integrations page error.
-- ================================================================
-- 1. Drop existing table if it exists (Single Row Format)
DROP TABLE IF EXISTS app_settings;
-- 2. Create the new Key-Value Store table
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- 3. Initial Seeding
INSERT INTO app_settings (key, value)
VALUES ('company_name', 'GT Group CRM'),
  ('logo_url', NULL) ON CONFLICT (key) DO NOTHING;
-- 4. Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- 5. RLS Policies
-- SELECT: Authenticated users can view all settings
DROP POLICY IF EXISTS "settings_select" ON app_settings;
CREATE POLICY "settings_select" ON app_settings FOR
SELECT TO authenticated USING (true);
-- ALL Actions: Only Super Admins can insert/update/delete settings
DROP POLICY IF EXISTS "settings_admin_all" ON app_settings;
CREATE POLICY "settings_admin_all" ON app_settings FOR ALL TO authenticated USING (
  (
    SELECT role
    FROM users
    WHERE id = auth.uid()
  ) IN ('ceo', 'coo', 'it_manager')
);
-- 6. Grant Permissions (for API)
GRANT ALL ON TABLE app_settings TO service_role;
GRANT ALL ON TABLE app_settings TO authenticated;