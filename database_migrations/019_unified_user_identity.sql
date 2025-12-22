-- Unified User Identity Migration (Revised)
-- This migration adds identity fields to user_profiles and links technicians/office_staff
-- via a new user_profile_id column (instead of making id the FK).

-- 1. Upgrade user_profiles table with new identity fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS nick_name TEXT,
ADD COLUMN IF NOT EXISTS user_types TEXT[],
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add UNIQUE constraint to email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_email_key'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- 2. Add user_profile_id column to technicians (optional link)
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 3. Add user_profile_id column to office_staff (optional link)
ALTER TABLE office_staff 
ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 4. Create indexes for the new FK columns
CREATE INDEX IF NOT EXISTS idx_technicians_user_profile_id ON technicians(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_office_staff_user_profile_id ON office_staff(user_profile_id);

-- 5. RLS Policy Updates (simplified - no dependency on user_roles)
-- These policies allow any authenticated user to manage records.
-- More granular RBAC can be added later via 003_rbac_schema.sql migration.

-- Policy for technicians: Authenticated users can manage
DROP POLICY IF EXISTS "Admins can manage technicians" ON technicians;
DROP POLICY IF EXISTS "Authenticated users can manage technicians" ON technicians;
CREATE POLICY "Authenticated users can manage technicians" ON technicians
    FOR ALL
    USING (auth.uid() IS NOT NULL);

-- Policy for office_staff: Authenticated users can manage
DROP POLICY IF EXISTS "Admins can manage office_staff" ON office_staff;
DROP POLICY IF EXISTS "Authenticated users can manage office_staff" ON office_staff;
CREATE POLICY "Authenticated users can manage office_staff" ON office_staff
    FOR ALL
    USING (auth.uid() IS NOT NULL);
