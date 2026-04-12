-- Migration 017: Email Logging & Tracking
-- Purpose: Track all emails sent, delivery status, and failures
-- Date: April 9, 2026

-- Create email log table
CREATE TABLE email_logs
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Email details
    from_email VARCHAR(255) NOT NULL,
    from_email_account_id UUID REFERENCES user_email_accounts(id) ON DELETE SET NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    -- Content
    email_type VARCHAR(50) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    -- Related entity
    related_type VARCHAR(50),
    related_id UUID,
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP
    WITH TIME ZONE,
    failed_at TIMESTAMP
    WITH TIME ZONE,
    -- Error tracking
    error_message TEXT,
    error_code VARCHAR
    (50),
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP
    WITH TIME ZONE,
    -- Email service details
    email_service VARCHAR
    (50),
    external_message_id VARCHAR
    (255),
    -- Metadata
    metadata JSONB,
    opened_at TIMESTAMP
    WITH TIME ZONE,
    clicked_at TIMESTAMP
    WITH TIME ZONE,
    -- Timestamps
    created_at TIMESTAMP
    WITH TIME ZONE DEFAULT NOW
    (),
    updated_at TIMESTAMP
    WITH TIME ZONE DEFAULT NOW
    (),
    -- User reference for filtering
    user_id UUID NOT NULL REFERENCES auth.users
    (id) ON
    DELETE CASCADE
);

    -- Create indexes
    CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
    CREATE INDEX idx_email_logs_status ON email_logs(status);
    CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
    CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
    CREATE INDEX idx_email_logs_related ON email_logs(related_type, related_id);
    CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
    CREATE INDEX idx_email_logs_next_retry ON email_logs(next_retry_at) WHERE status = 'pending';

    -- Enable RLS
    ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

    -- RLS Policy: Users can view their own emails
    CREATE POLICY email_logs_read ON email_logs
  FOR
    SELECT
        USING (
    auth.uid() = user_id
            OR
            auth.uid() IN (SELECT id
            FROM users
            WHERE role = 'super_admin')
  );

    -- RLS Policy: Users can insert their own logs
    CREATE POLICY email_logs_insert ON email_logs
  FOR
    INSERT
  WITH CHECK (auth.uid() =
    user_id);

    -- RLS Policy: System can update status
    CREATE POLICY email_logs_update ON email_logs
  FOR
    UPDATE
  USING (
    auth.uid()
    = user_id 
    OR auth.uid
    () IN
    (SELECT id
    FROM users
    WHERE role = 'super_admin')
    )
  WITH CHECK
    (
    auth.uid
    () = user_id 
    OR auth.uid
    () IN
    (SELECT id
    FROM users
    WHERE role = 'super_admin')
    );

    -- Trigger: Update updated_at
    CREATE OR REPLACE FUNCTION update_email_logs_timestamp
    ()
RETURNS TRIGGER AS $$
    BEGIN
  NEW.updated_at = NOW
    ();
    RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

    CREATE TRIGGER email_logs_update_timestamp
  BEFORE
    UPDATE ON email_logs
  FOR EACH ROW
    EXECUTE FUNCTION update_email_logs_timestamp
    ();

    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE ON email_logs TO authenticated;
