-- ================================================================
-- 023_make_settings_public.sql
-- Allow anonymous users to view app settings (Logo, Company Name, etc.)
-- This is required for the login page to show branding before sign-in.
-- ================================================================

-- 1. Update SELECT policy to allow public (anon) access
-- We drop the old "authenticated-only" policy and replace it with one that allows everyone.
-- Security Note: App settings only contains public branding info, no sensitive data.

DROP POLICY IF EXISTS "settings_select" ON app_settings;

CREATE POLICY "settings_select" ON app_settings 
FOR SELECT TO public 
USING (true);

-- 2. Verify settings are readable by anyone
-- SELECT * FROM app_settings;
