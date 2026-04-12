-- ================================================================
-- GT GROUP CRM — PROGRAM SCHEMA UPDATE
-- Changes tuition_fee to TEXT to allow ranges (e.g. "7000 to 8000")
-- Adds distinct specific requirement columns
-- ================================================================

-- 1. Alter tuition_fee to TEXT
ALTER TABLE programs ALTER COLUMN tuition_fee TYPE TEXT;

-- 2. Add explicit requirement fields
ALTER TABLE programs 
  ADD COLUMN IF NOT EXISTS req_ssc_gpa TEXT,
  ADD COLUMN IF NOT EXISTS req_hsc_gpa TEXT,
  ADD COLUMN IF NOT EXISTS req_topik TEXT,
  ADD COLUMN IF NOT EXISTS req_ielts TEXT,
  ADD COLUMN IF NOT EXISTS req_toefl TEXT,
  ADD COLUMN IF NOT EXISTS req_bank_statement TEXT;

-- Note: The existing "requirements" column naturally serves as the "ETC" / "Other Requirements" block.
