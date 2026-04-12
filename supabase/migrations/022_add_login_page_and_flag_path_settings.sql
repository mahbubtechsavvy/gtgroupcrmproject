-- ================================================================
-- 022_add_login_page_and_flag_path_settings.sql
-- Add flag_path column to destinations and login page customization settings
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Add flag_path column to destinations table
ALTER TABLE destinations
ADD COLUMN
IF NOT EXISTS flag_path TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN destinations.flag_path IS 'Path to SVG flag file (e.g., /country_flags/bangladesh_flag.svg)';

-- 2. Seed login page customization settings into app_settings
-- These will pull from existing settings with sensible defaults
INSERT INTO app_settings
    (key, value)
VALUES
    ('login_page_company_name', 'GT Group'),
    ('login_page_company_slogan', 'Study Abroad Consultancy'),
    ('login_page_background_primary_color', '#0F2542'),
    ('login_page_background_secondary_color', '#1A3F5C'),
    ('use_svg_flags', 'true')
ON CONFLICT
(key) DO NOTHING;

-- 3. Verify insertion
-- Run this query to confirm:
-- SELECT * FROM app_settings WHERE key ILIKE 'login_page_%' OR key = 'use_svg_flags';
