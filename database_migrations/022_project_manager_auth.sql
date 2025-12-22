-- Migration: Add user_profile_id to project_managers for client portal authentication
-- This links project managers (client contacts) to auth accounts

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_managers' AND column_name = 'user_profile_id'
    ) THEN
        ALTER TABLE project_managers 
        ADD COLUMN user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_project_managers_user_profile_id 
ON project_managers(user_profile_id);

-- Add RLS policy for project managers to read their own linked profile data
-- (This enables the client portal to query work orders)
