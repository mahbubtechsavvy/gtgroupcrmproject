-- ================================================================
-- GT GROUP CRM — ADD TASK PERIOD TRACKING
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add task_period column to staff_tasks table
ALTER TABLE staff_tasks 
ADD COLUMN
IF NOT EXISTS task_period TEXT DEFAULT 'daily' CHECK
(task_period IN
('daily','weekly','monthly'));

-- Create index on task_period for faster filtering
CREATE INDEX
IF NOT EXISTS idx_staff_tasks_period ON staff_tasks
(task_period);

-- Add comment for documentation
COMMENT ON COLUMN staff_tasks.task_period IS 'Frequency of the task: daily, weekly, or monthly';
