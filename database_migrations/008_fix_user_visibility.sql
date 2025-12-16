-- Migration: Fix user visibility for admins
-- Adds RLS policies to allow users with 'users:read' permission to view all profiles

-- Policy for reading all profiles (for listing users)
CREATE POLICY "Users with users:read permission can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (has_permission('users:read'));

-- Policy for updating profiles (e.g. assigning roles)
-- Note: 'users:manage' implies the ability to update user profiles
CREATE POLICY "Users with users:manage permission can update all profiles"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (has_permission('users:manage'));

-- Explanation:
-- The 'has_permission' function is SECURITY DEFINER, meaning it runs with the privileges
-- of the function creator (superuser). This avoids infinite recursion when checking
-- user_profiles table from within a policy on user_profiles table.
