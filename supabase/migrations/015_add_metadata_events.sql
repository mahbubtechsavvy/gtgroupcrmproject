-- ================================================================
-- GT GROUP CRM — ADD METADATA AND EVENT SUPPORT TO STAFF TASKS
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add metadata column to staff_tasks table
ALTER TABLE staff_tasks 
ADD COLUMN
IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Update task_period constraint to include 'event'
ALTER TABLE staff_tasks 
DROP CONSTRAINT IF EXISTS staff_tasks_task_period_check;

ALTER TABLE staff_tasks 
ADD CONSTRAINT staff_tasks_task_period_check 
CHECK (task_period IN ('daily','weekly','monthly','event'));

-- Create index on metadata for faster event queries
CREATE INDEX
IF NOT EXISTS idx_staff_tasks_metadata ON staff_tasks
USING GIN (metadata);

-- Add comment for documentation
COMMENT ON COLUMN staff_tasks.metadata IS 'JSON metadata for events and task details: {is_event: bool, event_time: string, event_office: uuid, event_location: string, google_meet_link: string}';
