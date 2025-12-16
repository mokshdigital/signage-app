-- Migration: Add RLS policies for managing RBAC tables
-- Allows users with appropriate permissions to manage roles and role_permissions
-- This fixes the issue where authenticated users couldn't create/update/delete roles

-- ============================================
-- 1. CREATE HELPER FUNCTION TO CHECK USER PERMISSIONS
-- ============================================
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM user_profiles up
        JOIN role_permissions rp ON rp.role_id = up.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE up.id = auth.uid() 
        AND p.name = required_permission
    ) INTO user_has_permission;
    
    RETURN COALESCE(user_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. DROP EXISTING RESTRICTIVE POLICIES
-- ============================================
-- Drop the old policies that only allowed service_role to manage
DROP POLICY IF EXISTS "Service role can manage roles" ON roles;
DROP POLICY IF EXISTS "Service role can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Service role can manage role_permissions" ON role_permissions;

-- ============================================
-- 3. CREATE NEW POLICIES FOR ROLES TABLE
-- ============================================

-- Users with roles:manage can insert new roles
CREATE POLICY "Users with roles:manage can create roles"
    ON roles FOR INSERT
    TO authenticated
    WITH CHECK (has_permission('roles:manage'));

-- Users with roles:manage can update roles
CREATE POLICY "Users with roles:manage can update roles"
    ON roles FOR UPDATE
    TO authenticated
    USING (has_permission('roles:manage'))
    WITH CHECK (has_permission('roles:manage'));

-- Users with roles:manage can delete non-system roles
CREATE POLICY "Users with roles:manage can delete non-system roles"
    ON roles FOR DELETE
    TO authenticated
    USING (has_permission('roles:manage') AND is_system = FALSE);

-- ============================================
-- 4. CREATE NEW POLICIES FOR ROLE_PERMISSIONS TABLE
-- ============================================

-- Users with roles:manage can insert role_permissions
CREATE POLICY "Users with roles:manage can create role_permissions"
    ON role_permissions FOR INSERT
    TO authenticated
    WITH CHECK (has_permission('roles:manage'));

-- Users with roles:manage can update role_permissions
CREATE POLICY "Users with roles:manage can update role_permissions"
    ON role_permissions FOR UPDATE
    TO authenticated
    USING (has_permission('roles:manage'))
    WITH CHECK (has_permission('roles:manage'));

-- Users with roles:manage can delete role_permissions
CREATE POLICY "Users with roles:manage can delete role_permissions"
    ON role_permissions FOR DELETE
    TO authenticated
    USING (has_permission('roles:manage'));

-- ============================================
-- 5. KEEP SERVICE ROLE FULL ACCESS (for migrations/admin)
-- ============================================
CREATE POLICY "Service role full access to roles"
    ON roles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to permissions"
    ON permissions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to role_permissions"
    ON role_permissions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 6. GRANT EXECUTE ON HELPER FUNCTION
-- ============================================
GRANT EXECUTE ON FUNCTION has_permission(TEXT) TO authenticated;

-- ============================================
-- 7. COMMENTS
-- ============================================
COMMENT ON FUNCTION has_permission(TEXT) IS 'Checks if the current authenticated user has the specified permission';
