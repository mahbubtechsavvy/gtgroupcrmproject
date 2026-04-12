-- Fix: Rename account_type column to email_type
-- This fixes the mismatch between Migration 016 and the application code
-- Date: April 9, 2026

-- Step 1: Rename the column from account_type to email_type
ALTER TABLE user_email_accounts 
RENAME COLUMN account_type TO email_type;

-- Step 2: Verify the change worked
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_email_accounts' 
  AND column_name = 'email_type'
ORDER BY ordinal_position;

-- Step 3: List all columns to verify (optional, for debugging)
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_email_accounts'
ORDER BY ordinal_position;
