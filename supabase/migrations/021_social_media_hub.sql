-- ================================================================
-- SOCIAL MEDIA COMMAND CENTER SCHEMA
-- ================================================================

-- 1. Table: office_social_accounts
CREATE TABLE IF NOT EXISTS office_social_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id     UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN (
    'facebook','instagram','tiktok','youtube','linkedin','twitter','whatsapp','custom'
  )),
  account_name  TEXT NOT NULL,
  page_url      TEXT,            -- Public page URL
  mgmt_url      TEXT,            -- Management URL (Ads Manager, Studio, etc.)
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  added_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Table: social_content_log
CREATE TABLE IF NOT EXISTS social_content_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id        UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  media_type       TEXT CHECK (media_type IN ('image','video','reel','story','text','ad','carousel')),
  post_description TEXT NOT NULL,
  post_url         TEXT,
  posted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  logged_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: social_audit_log
CREATE TABLE IF NOT EXISTS social_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,  -- 'view_accounts', 'add_account', 'edit_account', 'delete_account', 'view_whatsapp'
  account_id  UUID,
  office_id   UUID,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_social_accts_office ON office_social_accounts(office_id);
CREATE INDEX IF NOT EXISTS idx_social_log_office ON social_content_log(office_id);
CREATE INDEX IF NOT EXISTS idx_social_audit_user ON social_audit_log(user_id);

-- Enable RLS
ALTER TABLE office_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Policies: office_social_accounts
CREATE POLICY "social_accts_select" ON office_social_accounts FOR SELECT TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());

CREATE POLICY "social_accts_insert" ON office_social_accounts FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "social_accts_update" ON office_social_accounts FOR UPDATE TO authenticated
  USING (is_super_admin());

CREATE POLICY "social_accts_delete" ON office_social_accounts FOR DELETE TO authenticated
  USING (is_super_admin());

-- 5. Policies: social_content_log
CREATE POLICY "content_log_select" ON social_content_log FOR SELECT TO authenticated
  USING (is_super_admin() OR office_id = get_my_office_id());

CREATE POLICY "content_log_insert" ON social_content_log FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

-- 6. Policies: social_audit_log
CREATE POLICY "audit_log_select" ON social_audit_log FOR SELECT TO authenticated
  USING (is_super_admin());

-- System policy for audit log (system needs to insert)
-- Note: Service role is usually bypassed, but for explicit insert from API:
CREATE POLICY "audit_log_system_insert" ON social_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);
