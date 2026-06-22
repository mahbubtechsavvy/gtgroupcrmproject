-- ================================================================
-- 051: EVENTS & EXPO + MARKETING TABLES
-- ================================================================

BEGIN;

-- 1. Marketing Events Table
CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('event','expo','webinar','seminar')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  meeting_link TEXT,
  max_capacity INTEGER,
  registration_deadline TIMESTAMPTZ,
  is_exclusive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Marketing Event Registrations Table
CREATE TABLE IF NOT EXISTS marketing_event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  event_id UUID REFERENCES marketing_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled')),
  qr_code_url TEXT,
  registered_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Marketing Assets Table
CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image','template','reel_idea','ad_copy','campaign','social_post')),
  content TEXT,
  file_url TEXT,
  tags TEXT[],
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;

-- 5. Create Tenant Isolation Policies (Own office or super admin role)
CREATE POLICY "marketing_events_isolation" ON marketing_events
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

CREATE POLICY "marketing_event_registrations_isolation" ON marketing_event_registrations
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

CREATE POLICY "marketing_assets_isolation" ON marketing_assets
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

-- Seed Initial Marketing Templates
INSERT INTO marketing_assets (office_id, title, type, content, tags, ai_generated)
SELECT 
  id as office_id,
  'Standard WhatsApp Follow-up' as title,
  'template' as type,
  'Dear [Student Name], hope you are doing well! We noticed you are interested in studying in [Target Country]. Let us know if you want to schedule a free expert consultation session this week. Regards, GT Group.' as content,
  ARRAY['whatsapp', 'follow-up', 'general'] as tags,
  false as ai_generated
FROM offices LIMIT 1;

COMMIT;
