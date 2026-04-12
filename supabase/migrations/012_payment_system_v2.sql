-- ================================================================
-- 012_payment_system_v2.sql
-- Enhanced payment tracking and Promo Code management.
-- ================================================================

-- 1. Create Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_amount NUMERIC NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Update Payments Table with detailed tracking
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS semester TEXT,
  ADD COLUMN IF NOT EXISTS fee_type TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;

-- 3. RLS for Promo Codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- SELECT: Staff can see codes for their office or global codes
DROP POLICY IF EXISTS "promo_codes_select" ON promo_codes;
CREATE POLICY "promo_codes_select" ON promo_codes FOR SELECT TO authenticated
  USING (
    is_global = true 
    OR office_id = (SELECT office_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
  );

-- ALL: Only Super Admins can MANAGE promo codes
DROP POLICY IF EXISTS "promo_codes_manage" ON promo_codes;
CREATE POLICY "promo_codes_manage" ON promo_codes FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
  );

-- 4. Audit Log Update (Ensure history capture includes new fields)
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO payment_history (
      payment_id, changed_by, old_status, new_status, old_amount, new_amount, note
    ) VALUES (
      OLD.id, auth.uid(), OLD.status, NEW.status, OLD.amount, NEW.amount, 
      format('Update: Type=%s, Semester=%s, Promo=%s', NEW.fee_type, NEW.semester, NEW.promo_code_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
