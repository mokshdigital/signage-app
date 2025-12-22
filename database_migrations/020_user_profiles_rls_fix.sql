-- Fix RLS for user_profiles to allow admin user creation
-- This allows users with admin roles to create profiles for invited users

-- 1. Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- 2. Create new policies for user_profiles

-- All authenticated users can read profiles (needed for dropdowns, directories)
CREATE POLICY "Authenticated users can read profiles" ON user_profiles
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can manage all profiles (insert, update, delete)
-- Check if user has a role that is admin-level (super_admin, admin, owner)
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid()
            AND r.name IN ('super_admin', 'admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid()
            AND r.name IN ('super_admin', 'admin', 'owner')
        )
    );

-- Allow authenticated users to insert if they are creating for themselves (on sign-up)
-- OR if they are an admin
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = id  -- Creating own profile
        OR EXISTS (      -- Or is admin
            SELECT 1 FROM user_profiles up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid()
            AND r.name IN ('super_admin', 'admin', 'owner')
        )
    );
