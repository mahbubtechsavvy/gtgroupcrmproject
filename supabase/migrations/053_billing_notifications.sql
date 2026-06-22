-- Migration: 053_billing_notifications.sql
-- Description: Subscription Plans, Tenant Subscriptions, & Notifications Tables
-- Phase: 8
-- Date: 2026-06-22

BEGIN;

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,              -- 'GO', 'UP', 'MAX', 'UNIVERSITY'
  price_per_period NUMERIC(10, 2),
  period_months INTEGER,           -- e.g. 4 months
  student_quota_min INTEGER,
  student_quota_max INTEGER,
  staff_accounts INTEGER,
  features JSONB,                  -- Feature flags as JSON: {"cctv": true, "ai": "advanced"}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tenant Subscriptions Table
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','trial')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  student_count INTEGER DEFAULT 0,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Notifications Table Update / Creation
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- 'application_update','document_issue','admission_result','payment_alert','task_due'
  title TEXT NOT NULL,
  body TEXT,
  message TEXT,
  data JSONB,                      -- Entity references (student_id, application_id, etc.)
  metadata JSONB,
  channels TEXT[],                 -- ['in_app', 'email', 'sms', 'whatsapp']
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alter existing notifications table to add any missing columns and remove constraints from 007
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES offices(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channels TEXT[];
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Drop check constraint from 007 if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Alter type column to remove default check or allow any text
ALTER TABLE notifications ALTER COLUMN type DROP DEFAULT;
ALTER TABLE notifications ALTER COLUMN type SET DATA TYPE TEXT;

-- Create function to synchronize body/message and data/metadata columns
CREATE OR REPLACE FUNCTION sync_notification_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync message and body
  IF NEW.body IS NOT NULL AND NEW.message IS NULL THEN
    NEW.message := NEW.body;
  ELSIF NEW.message IS NOT NULL AND NEW.body IS NULL THEN
    NEW.body := NEW.message;
  END IF;

  -- Sync data and metadata
  IF NEW.data IS NOT NULL AND NEW.metadata IS NULL THEN
    NEW.metadata := NEW.data;
  ELSIF NEW.metadata IS NOT NULL AND NEW.data IS NULL THEN
    NEW.data := NEW.metadata;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it runs before inserts/updates
DROP TRIGGER IF EXISTS sync_notification_columns_trigger ON notifications;
CREATE TRIGGER sync_notification_columns_trigger
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_notification_columns();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
DROP POLICY IF EXISTS "subscription_plans_read_policy" ON subscription_plans;
CREATE POLICY "subscription_plans_read_policy" ON subscription_plans
  FOR SELECT TO authenticated USING (true); -- Anyone logged in can view plans

DROP POLICY IF EXISTS "subscription_plans_admin_policy" ON subscription_plans;
CREATE POLICY "subscription_plans_admin_policy" ON subscription_plans
  FOR ALL TO authenticated USING (is_super_admin()); -- Super admins can manage plans

DROP POLICY IF EXISTS "tenant_subscriptions_isolation" ON tenant_subscriptions;
CREATE POLICY "tenant_subscriptions_isolation" ON tenant_subscriptions
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

-- Drop any pre-existing policies on notifications table
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_isolation" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;

-- Create granular security policies for notifications
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT TO authenticated USING (
    is_super_admin() OR user_id = auth.uid() OR office_id = get_my_office_id()
  );

CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE TO authenticated USING (
    is_super_admin() OR user_id = auth.uid() OR office_id = get_my_office_id()
  );

CREATE POLICY "notifications_delete_policy" ON notifications
  FOR DELETE TO authenticated USING (
    is_super_admin() OR user_id = auth.uid() OR office_id = get_my_office_id()
  );

CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Seed subscription plans (GO, UP, MAX, UNIVERSITY)
INSERT INTO subscription_plans (name, price_per_period, period_months, student_quota_min, student_quota_max, staff_accounts, features) VALUES
('GO', 79.00, 4, 1, 7, 2, '{"cctv": false, "ai_document_analysis": false, "human_document_review": true, "marketing_support": true, "events": true}'),
('UP', 139.00, 4, 5, 13, 5, '{"cctv": true, "cctv_max_cameras": 6, "ai_document_analysis": true, "ai_document_analysis_quota": 10, "human_document_review": true, "marketing_support": true, "events": true}'),
('MAX', 199.00, 4, 8, 25, 13, '{"cctv": true, "cctv_max_cameras": 15, "ai_document_analysis": true, "ai_document_analysis_quota": 25, "human_document_review": true, "marketing_support": true, "events": true}'),
('UNIVERSITY', 149.00, 1, 0, 99999, 99, '{"cctv": false, "ai_document_analysis": false, "human_document_review": false, "marketing_support": false, "events": true}')
ON CONFLICT (name) DO NOTHING;

COMMIT;
