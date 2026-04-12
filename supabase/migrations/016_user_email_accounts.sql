-- Migration 016: User Email Accounts Table
-- Purpose: Store user's multiple email addresses and their types
-- Date: April 9, 2026

-- Create enum for email types
CREATE TYPE email_account_type AS ENUM
('crm', 'gmail', 'office');

-- Create user_email_accounts table
CREATE TABLE user_email_accounts
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Email details
  email VARCHAR(255) NOT NULL,
  account_type email_account_type NOT NULL,
  display_name VARCHAR(255),

  -- Email verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP
  WITH TIME ZONE,
  verification_token VARCHAR
  (255),
  verification_sent_at TIMESTAMP
  WITH TIME ZONE,
  
  -- Gmail/OAuth integration
  is_primary BOOLEAN DEFAULT FALSE,
  oauth_connected BOOLEAN DEFAULT FALSE,
  oauth_provider VARCHAR
  (50), -- 'google', 'microsoft', etc.
  oauth_token TEXT, -- Encrypted in production
  oauth_refresh_token TEXT, -- Encrypted in production
  oauth_expires_at TIMESTAMP
  WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW
  (),
  updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW
  (),
  last_used_at TIMESTAMP
  WITH TIME ZONE,
  
  -- Constraints
  UNIQUE
  (user_id, email),
  UNIQUE
  (user_id, account_type) -- One primary per type
);

  -- Create index for faster lookups
  CREATE INDEX idx_user_email_accounts_user_id ON user_email_accounts(user_id);
  CREATE INDEX idx_user_email_accounts_staff_id ON user_email_accounts(staff_id);
  CREATE INDEX idx_user_email_accounts_email ON user_email_accounts(email);
  CREATE INDEX idx_user_email_accounts_oauth ON user_email_accounts(oauth_connected, oauth_provider);

  -- Enable RLS
  ALTER TABLE user_email_accounts ENABLE ROW LEVEL SECURITY;

  -- RLS Policy: Users can only view their own email accounts
  CREATE POLICY user_email_accounts_read ON user_email_accounts
  FOR
  SELECT
    USING (
    auth.uid() = user_id
      OR
      auth.uid() IN (
      SELECT id
      FROM users
      WHERE role = 'super_admin'
    )
  );

  -- RLS Policy: Users can only update their own email accounts
  CREATE POLICY user_email_accounts_update ON user_email_accounts
  FOR
  UPDATE
  USING (auth.uid()
  = user_id)
  WITH CHECK
  (auth.uid
  () = user_id);

  -- RLS Policy: Users can insert their own email accounts
  CREATE POLICY user_email_accounts_insert ON user_email_accounts
  FOR
  INSERT
  WITH CHECK (auth.uid() =
  user_id);

  -- RLS Policy: Users can delete their own email accounts
  CREATE POLICY user_email_accounts_delete ON user_email_accounts
  FOR
  DELETE
  USING (auth.uid
  () = user_id);

  -- Trigger: Update updated_at automatically
  CREATE OR REPLACE FUNCTION update_user_email_accounts_timestamp
  ()
RETURNS TRIGGER AS $$
  BEGIN
  NEW.updated_at = NOW
  ();
  RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

  CREATE TRIGGER user_email_accounts_update_timestamp
  BEFORE
  UPDATE ON user_email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_email_accounts_timestamp
  ();

  -- Grant permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON user_email_accounts TO authenticated;
  GRANT USAGE ON TYPE email_account_type TO authenticated;
