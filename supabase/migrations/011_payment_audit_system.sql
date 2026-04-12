-- ================================================================
-- 011_payment_audit_system.sql
-- Run this in your Supabase SQL Editor. 
-- Role-based payment guards and audit trails for GT Group CRM.
-- ================================================================

-- 1. Create Payment History Table (The "Audit Log")
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_status TEXT,
  new_status TEXT,
  old_amount NUMERIC,
  new_amount NUMERIC,
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Refine RLS Policies for Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- SELECT: Super Admin see all. Staff see payments for their own office only.
DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager') 
    OR office_id = (SELECT office_id FROM users WHERE id = auth.uid())
  );

-- INSERT: Any authenticated staff member can record a payment (can_create)
DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: Only Office Managers and Super Admins can EDIT a payment.
-- Regular counselors and receptionists are blocked from editing.
DROP POLICY IF EXISTS "payments_update" ON payments;
CREATE POLICY "payments_update" ON payments FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager','office_manager')
  );

-- 3. Automatic Audit Trigger
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO payment_history (
      payment_id, changed_by, old_status, new_status, old_amount, new_amount, note
    ) VALUES (
      OLD.id, auth.uid(), OLD.status, NEW.status, OLD.amount, NEW.amount, 'Status/Amount Update'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_audit_payment_changes ON payments;
CREATE TRIGGER tr_audit_payment_changes
  AFTER UPDATE ON payments
  FOR EACH ROW EXECUTE PROCEDURE audit_payment_changes();

-- 4. Audit Table Permissions
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_history_select" ON payment_history FOR SELECT TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo', 'coo', 'it_manager', 'office_manager')
  );

-- 5. Seed default Branding and Currency keys in app_settings (Key-Value)
INSERT INTO app_settings (key, value) VALUES
  ('company_name', 'GT Group CRM'),
  ('primary_currency', 'USD'),
  ('primary_timezone', 'Asia/Dhaka'),
  ('system_slogan', 'GT Group — Verified Study Abroad Partner'),
  ('brand_color', '#C9A227'),
  ('logo_url', '/logo.png')
ON CONFLICT (key) DO NOTHING;
