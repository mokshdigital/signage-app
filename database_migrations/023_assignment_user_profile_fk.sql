-- Migration: Change assignment tables to reference user_profiles directly
-- This enables full deprecation of technicians.name field and simplifies the data model

-- =============================================
-- WORK ORDER ASSIGNMENTS
-- =============================================

-- Add user_profile_id column
ALTER TABLE work_order_assignments 
ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Migrate existing data: technician_id -> user_profile_id via technicians.user_profile_id
UPDATE work_order_assignments woa
SET user_profile_id = t.user_profile_id
FROM technicians t
WHERE woa.technician_id = t.id AND t.user_profile_id IS NOT NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_work_order_assignments_user_profile 
ON work_order_assignments(user_profile_id);

-- =============================================
-- TASK ASSIGNMENTS
-- =============================================

-- Add user_profile_id column
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Migrate existing data
UPDATE task_assignments ta
SET user_profile_id = t.user_profile_id
FROM technicians t
WHERE ta.technician_id = t.id AND t.user_profile_id IS NOT NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_profile 
ON task_assignments(user_profile_id);

-- =============================================
-- DROP OLD technician_id COLUMNS (BREAKING CHANGE)
-- =============================================
-- These columns are no longer needed since we reference user_profiles directly

-- =============================================
-- TASK COMMENT MENTIONS
-- =============================================

-- Migrate existing technician mentions to user mentions
UPDATE task_comment_mentions m
SET mentioned_user_id = t.user_profile_id
FROM technicians t
WHERE m.mentioned_technician_id = t.id 
  AND m.mentioned_user_id IS NULL 
  AND t.user_profile_id IS NOT NULL;

-- Remove mentioned_technician_id column
ALTER TABLE task_comment_mentions DROP COLUMN IF EXISTS mentioned_technician_id;
ALTER TABLE work_order_assignments DROP COLUMN IF EXISTS technician_id;
ALTER TABLE task_assignments DROP COLUMN IF EXISTS technician_id;

