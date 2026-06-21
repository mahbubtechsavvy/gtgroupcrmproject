-- Migration 033: Global Website Connectivity Settings
-- Purpose: Store production URLs for the three main websites

INSERT INTO public.app_settings (key, value)
VALUES 
    ('site_url_main', 'https://gt-group-main.vercel.app'),
    ('site_url_study_abroad', 'https://gt-study-abroad.vercel.app'),
    ('site_url_nexus', 'https://nexus-digital.vercel.app')
ON CONFLICT (key) DO NOTHING;
