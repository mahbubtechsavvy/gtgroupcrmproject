-- Migration 020: Create Tasks & Events Tables
-- Purpose: Store tasks and events for team management
-- Date: April 9, 2026

-- Create enum for task status
CREATE TYPE task_status AS ENUM
('open', 'in_progress', 'completed', 'cancelled', 'on_hold');

-- Create enum for task priority
CREATE TYPE task_priority AS ENUM
('low', 'medium', 'high', 'urgent');

-- Create enum for event type
CREATE TYPE event_type AS ENUM
('meeting', 'deadline', 'follow_up', 'reminder', 'other');

-- Create tasks table
CREATE TABLE tasks
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Assignment & tracking
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Status & priority
    status task_status DEFAULT 'open',
    priority task_priority DEFAULT 'medium',

    -- Dates
    due_date TIMESTAMP
    WITH TIME ZONE,
    start_date TIMESTAMP
    WITH TIME ZONE,
    completed_at TIMESTAMP
    WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    attachments JSONB DEFAULT '[]'::JSONB,
    
    -- Timestamps
    created_at TIMESTAMP
    WITH TIME ZONE DEFAULT NOW
    (),
    updated_at TIMESTAMP
    WITH TIME ZONE DEFAULT NOW
    (),
    
    CONSTRAINT valid_dates CHECK
    (start_date <= due_date)
);

    -- Create events table
    CREATE TABLE events
    (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Event details
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type event_type DEFAULT 'other',

        -- Organization
        created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

        -- Dates & timing
        start_date TIMESTAMP
        WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP
        WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    
    -- Location & attendees
    location VARCHAR
        (255),
    attendees UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Integration
    google_event_id VARCHAR
        (255),
    meet_link VARCHAR
        (255),
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    attachments JSONB DEFAULT '[]'::JSONB,
    
    -- Calendar sync
    synced_at TIMESTAMP
        WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP
        WITH TIME ZONE DEFAULT NOW
        (),
    updated_at TIMESTAMP
        WITH TIME ZONE DEFAULT NOW
        (),
    
    CONSTRAINT valid_event_dates CHECK
        (start_date < end_date)
);

        -- Create task comments table
        CREATE TABLE task_comments
        (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

            -- Comment details
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
            comment TEXT NOT NULL,

            -- Timestamps
            created_at TIMESTAMP
            WITH TIME ZONE DEFAULT NOW
            (),
    updated_at TIMESTAMP
            WITH TIME ZONE DEFAULT NOW
            ()
);

            -- Create indexes for performance
            CREATE INDEX idx_tasks_created_by ON tasks(created_by);
            CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
            CREATE INDEX idx_tasks_status ON tasks(status);
            CREATE INDEX idx_tasks_priority ON tasks(priority);
            CREATE INDEX idx_tasks_due_date ON tasks(due_date);
            CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

            CREATE INDEX idx_events_created_by ON events(created_by);
            CREATE INDEX idx_events_start_date ON events(start_date);
            CREATE INDEX idx_events_attendees ON events USING GIN
            (attendees);
            CREATE INDEX idx_events_created_at ON events(created_at DESC);

            CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
            CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

            -- Enable RLS
            ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
            ALTER TABLE events ENABLE ROW LEVEL SECURITY;
            ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

            -- RLS Policies: Users can see tasks assigned to them or created by them
            CREATE POLICY tasks_read ON tasks
FOR
            SELECT
                USING (
    auth.uid() = created_by
                    OR auth.uid() = assigned_to
                    OR auth.uid() IN (SELECT id
                    FROM users
                    WHERE role = 'super_admin')
);

            CREATE POLICY tasks_insert ON tasks
FOR
            INSERT
WITH CHECK (auth.uid() =
            created_by);

            CREATE POLICY tasks_update ON tasks
FOR
            UPDATE
USING (
    auth.uid()
            = created_by 
    OR auth.uid
            () = assigned_to 
    OR auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            )
WITH CHECK
            (
    auth.uid
            () = created_by 
    OR auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            );

            CREATE POLICY tasks_delete ON tasks
FOR
            DELETE
USING (
    auth.uid
            () = created_by 
    OR auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            );

            -- RLS Policies: Events visible to attendees and creator
            CREATE POLICY events_read ON events
FOR
            SELECT
                USING (
    auth.uid() = created_by
                    OR auth.uid() = ANY(attendees)
                    OR auth.uid() IN (SELECT id
                    FROM users
                    WHERE role = 'super_admin')
);

            CREATE POLICY events_insert ON events
FOR
            INSERT
WITH CHECK (auth.uid() =
            created_by);

            CREATE POLICY events_update ON events
FOR
            UPDATE
USING (
    auth.uid()
            = created_by 
    OR auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            );

            CREATE POLICY events_delete ON events
FOR
            DELETE
USING (
    auth.uid
            () = created_by 
    OR auth.uid
            () IN
            (SELECT id
            FROM users
            WHERE role = 'super_admin')
            );

            -- RLS Policies: Task comments
            CREATE POLICY task_comments_read ON task_comments
FOR
            SELECT
                USING (
    task_id IN (SELECT id
                    FROM tasks
                    WHERE auth.uid() = created_by OR auth.uid() = assigned_to)
                    OR auth.uid() IN (SELECT id
                    FROM users
                    WHERE role = 'super_admin')
);

            CREATE POLICY task_comments_insert ON task_comments
FOR
            INSERT
WITH CHECK (auth.uid() =
            user_id);

            -- Trigger for updated_at
            CREATE OR REPLACE FUNCTION update_tasks_timestamp
            ()
RETURNS TRIGGER AS $$
            BEGIN
    NEW.updated_at = NOW
            ();
            RETURN NEW;
            END;
$$ LANGUAGE plpgsql;

            CREATE TRIGGER tasks_update_timestamp
BEFORE
            UPDATE ON tasks
FOR EACH ROW
            EXECUTE FUNCTION update_tasks_timestamp
            ();

            CREATE TRIGGER events_update_timestamp
BEFORE
            UPDATE ON events
FOR EACH ROW
            EXECUTE FUNCTION update_tasks_timestamp
            ();

            -- Grant permissions
            GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
            GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
            GRANT SELECT, INSERT, UPDATE, DELETE ON task_comments TO authenticated;
            GRANT USAGE ON TYPE task_status TO authenticated;
            GRANT USAGE ON TYPE task_priority TO authenticated;
            GRANT USAGE ON TYPE event_type TO authenticated;
