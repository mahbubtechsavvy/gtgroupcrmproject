-- Migration 018: Email Policies (Phase 5)
-- Purpose: Allow Super Admin to create email routing policies
-- Date: April 9, 2026

-- Create email_policies table
CREATE TABLE email_policies
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Policy metadata
    policy_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    policy_type VARCHAR(50) NOT NULL DEFAULT 'custom',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    -- Policy configuration
    rules JSONB NOT NULL DEFAULT '{}',
    -- Additional features
    use_templates BOOLEAN DEFAULT TRUE,
    track_opens BOOLEAN DEFAULT TRUE,
    require_approval BOOLEAN DEFAULT FALSE,
    -- Enforcement scope
    applies_to_users UUID
    [] DEFAULT ARRAY[]::UUID[],
    applies_to_departments UUID[] DEFAULT ARRAY[]::UUID[],
    -- Metadata
    created_by UUID REFERENCES auth.users
    (id) ON
    DELETE
    SET NULL
    ,
    created_at TIMESTAMP
    WITH TIME ZONE DEFAULT NOW
    (),
    updated_by UUID,
    updated_at TIMESTAMP
    WITH TIME ZONE,
    version INT DEFAULT 1,
    CONSTRAINT valid_policy_type CHECK
    (policy_type IN
    ('default', 'department', 'custom', 'role_based'))
);

    -- Create email_policy_audit table (for compliance)
    CREATE TABLE email_policy_audit
    (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id UUID NOT NULL REFERENCES email_policies(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        old_rules JSONB,
        new_rules JSONB,
        reason TEXT,
        created_at TIMESTAMP
        WITH TIME ZONE DEFAULT NOW
        ()
);

        -- Create policy_email_accounts mapping table
        CREATE TABLE policy_email_accounts
        (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            policy_id UUID NOT NULL REFERENCES email_policies(id) ON DELETE CASCADE,
            email_account_id UUID NOT NULL REFERENCES user_email_accounts(id) ON DELETE CASCADE,
            priority INT DEFAULT 0,
            is_primary BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP
            WITH TIME ZONE DEFAULT NOW
            (),
    UNIQUE
            (policy_id, email_account_id)
);

            -- Create indexes for performance
            CREATE INDEX idx_email_policies_active ON email_policies(is_active) WHERE is_active = TRUE;
            CREATE INDEX idx_email_policies_default ON email_policies(is_default) WHERE is_default = TRUE;
            CREATE INDEX idx_email_policy_audit_policy ON email_policy_audit(policy_id);
            CREATE INDEX idx_email_policy_audit_user ON email_policy_audit(user_id);
            CREATE INDEX idx_policy_email_accounts_policy ON policy_email_accounts(policy_id);
            CREATE INDEX idx_policy_email_accounts_account ON policy_email_accounts(email_account_id);

            -- Enable RLS
            ALTER TABLE email_policies ENABLE ROW LEVEL SECURITY;
            ALTER TABLE email_policy_audit ENABLE ROW LEVEL SECURITY;
            ALTER TABLE policy_email_accounts ENABLE ROW LEVEL SECURITY;

            -- RLS Policies: Super Admin only
            CREATE POLICY email_policies_super_admin ON email_policies
  FOR ALL
  USING
            (auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            )
  WITH CHECK
            (auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            );

            CREATE POLICY email_policy_audit_super_admin ON email_policy_audit
  FOR ALL
  USING
            (auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            );

            CREATE POLICY policy_email_accounts_super_admin ON policy_email_accounts
  FOR ALL
  USING
            (auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            );

            -- Trigger for updated_at
            CREATE OR REPLACE FUNCTION update_email_policies_timestamp
            ()
RETURNS TRIGGER AS $$
            BEGIN
  NEW.updated_at = NOW
            ();
            RETURN NEW;
            END;
$$ LANGUAGE plpgsql;

            CREATE TRIGGER email_policies_update_timestamp
  BEFORE
            UPDATE ON email_policies
  FOR EACH ROW
            EXECUTE FUNCTION update_email_policies_timestamp
            ();

            -- Grant permissions
            GRANT SELECT, INSERT, UPDATE, DELETE ON email_policies TO authenticated;
            GRANT SELECT, INSERT ON email_policy_audit TO authenticated;
            GRANT SELECT, INSERT, UPDATE, DELETE ON policy_email_accounts TO authenticated;
