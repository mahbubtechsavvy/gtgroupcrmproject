-- Migration: 052_applications_finance.sql
-- Description: University Applications & Financial Management Tables
-- Phase: 7
-- Date: 2026-06-22

BEGIN;

-- 1. University Applications Table
CREATE TABLE IF NOT EXISTS university_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','submitted','gt_review','under_review',
    'docs_required','accepted','rejected','offer_issued','enrolled'
  )),
  intake_year INTEGER,
  intake_month TEXT,
  application_fee_paid BOOLEAN DEFAULT false,
  offer_letter_url TEXT,
  rejection_reason TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Application Status History Table
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES university_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Financial Transactions Table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  amount_in_usd NUMERIC(12, 2),
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash','bank_transfer','mobile_banking','card','other')),
  reference_number TEXT,
  description TEXT,
  receipt_url TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Commissions Table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  application_id UUID REFERENCES university_applications(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  commission_rate NUMERIC(5, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','invoiced','paid','disputed')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE university_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- 6. Create Tenant Isolation Policies
CREATE POLICY "university_applications_isolation" ON university_applications
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

CREATE POLICY "application_status_history_isolation" ON application_status_history
  FOR ALL TO authenticated USING (
    is_super_admin() OR 
    EXISTS (
      SELECT 1 FROM university_applications ua 
      WHERE ua.id = application_status_history.application_id AND ua.office_id = get_my_office_id()
    )
  );

CREATE POLICY "financial_transactions_isolation" ON financial_transactions
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

CREATE POLICY "commissions_isolation" ON commissions
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

COMMIT;
