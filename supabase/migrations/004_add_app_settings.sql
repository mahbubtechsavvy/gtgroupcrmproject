-- ================================================================
-- 004_add_app_settings.sql
-- Run this in your Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT DEFAULT 'GT Group CRM',
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO app_settings (id, company_name) VALUES (1, 'GT Group CRM') ON CONFLICT DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_update" ON app_settings FOR UPDATE TO authenticated USING (is_super_admin());

-- ================================================================
-- STORAGE BUCKETS
-- ================================================================

-- Attempt to create the public_assets bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public_assets', 'public_assets', true) 
ON CONFLICT DO NOTHING;

-- Attempt to create the avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT DO NOTHING;

-- Provide public access policies
CREATE POLICY "Public Assets are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'public_assets' );

CREATE POLICY "Admins can upload public assets."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'public_assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Avatar Images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload avatars."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
