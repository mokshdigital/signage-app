-- Migration: Create RBAC (Role-Based Access Control) tables
-- Creates roles, permissions, and role_permissions junction table
-- Adds role_id to user_profiles
-- Seeds Super Admin role with all permissions

-- ============================================
-- 1. CREATE ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- slug: 'super_admin', 'technician'
    display_name TEXT NOT NULL, -- 'Super Admin', 'Technician'
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);

-- ============================================
-- 2. CREATE PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'work_orders:create'
    resource TEXT NOT NULL, -- 'work_orders'
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- ============================================
-- 3. CREATE ROLE_PERMISSIONS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================
-- 4. ADD ROLE_ID TO USER_PROFILES
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);

-- ============================================
-- 5. ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Roles: Authenticated users can read, only service role can modify
CREATE POLICY "Authenticated users can read roles"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage roles"
    ON roles FOR ALL
    TO service_role
    USING (true);

-- Permissions: Authenticated users can read
CREATE POLICY "Authenticated users can read permissions"
    ON permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage permissions"
    ON permissions FOR ALL
    TO service_role
    USING (true);

-- Role Permissions: Authenticated users can read
CREATE POLICY "Authenticated users can read role_permissions"
    ON role_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage role_permissions"
    ON role_permissions FOR ALL
    TO service_role
    USING (true);

-- ============================================
-- 6. AUTO-UPDATE TRIGGER FOR ROLES
-- ============================================
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS roles_updated_at ON roles;
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- ============================================
-- 7. SEED PERMISSIONS
-- ============================================
INSERT INTO permissions (name, resource, action, description) VALUES
    -- Users
    ('users:create', 'users', 'create', 'Create new users'),
    ('users:read', 'users', 'read', 'View user list and profiles'),
    ('users:update', 'users', 'update', 'Update user information'),
    ('users:delete', 'users', 'delete', 'Delete users'),
    ('users:manage', 'users', 'manage', 'Full control over users'),
    
    -- Roles
    ('roles:create', 'roles', 'create', 'Create new roles'),
    ('roles:read', 'roles', 'read', 'View roles'),
    ('roles:update', 'roles', 'update', 'Update role permissions'),
    ('roles:delete', 'roles', 'delete', 'Delete non-system roles'),
    ('roles:manage', 'roles', 'manage', 'Full control over roles'),
    
    -- Work Orders
    ('work_orders:create', 'work_orders', 'create', 'Create work orders'),
    ('work_orders:read', 'work_orders', 'read', 'View work orders'),
    ('work_orders:update', 'work_orders', 'update', 'Update work orders'),
    ('work_orders:delete', 'work_orders', 'delete', 'Delete work orders'),
    ('work_orders:manage', 'work_orders', 'manage', 'Full control over work orders'),
    ('work_orders:assign', 'work_orders', 'assign', 'Assign work orders to technicians'),
    
    -- Technicians
    ('technicians:create', 'technicians', 'create', 'Add new technicians'),
    ('technicians:read', 'technicians', 'read', 'View technician list'),
    ('technicians:update', 'technicians', 'update', 'Update technician info'),
    ('technicians:delete', 'technicians', 'delete', 'Remove technicians'),
    ('technicians:manage', 'technicians', 'manage', 'Full control over technicians'),
    
    -- Equipment
    ('equipment:create', 'equipment', 'create', 'Add new equipment'),
    ('equipment:read', 'equipment', 'read', 'View equipment inventory'),
    ('equipment:update', 'equipment', 'update', 'Update equipment status'),
    ('equipment:delete', 'equipment', 'delete', 'Remove equipment'),
    ('equipment:manage', 'equipment', 'manage', 'Full control over equipment'),
    
    -- Vehicles
    ('vehicles:create', 'vehicles', 'create', 'Add new vehicles'),
    ('vehicles:read', 'vehicles', 'read', 'View vehicle fleet'),
    ('vehicles:update', 'vehicles', 'update', 'Update vehicle info'),
    ('vehicles:delete', 'vehicles', 'delete', 'Remove vehicles'),
    ('vehicles:manage', 'vehicles', 'manage', 'Full control over vehicles'),
    
    -- Reports
    ('reports:read', 'reports', 'read', 'View reports and analytics'),
    ('reports:create', 'reports', 'create', 'Generate reports'),
    ('reports:manage', 'reports', 'manage', 'Full control over reports'),
    
    -- Settings
    ('settings:read', 'settings', 'read', 'View system settings'),
    ('settings:update', 'settings', 'update', 'Update system settings'),
    ('settings:manage', 'settings', 'manage', 'Full control over settings'),
    
    -- Dashboard
    ('dashboard:read', 'dashboard', 'read', 'Access main dashboard')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 8. SEED SUPER ADMIN ROLE
-- ============================================
INSERT INTO roles (name, display_name, description, is_system)
VALUES ('super_admin', 'Super Admin', 'Full system access with ability to manage roles and permissions', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 9. GRANT ALL PERMISSIONS TO SUPER ADMIN
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    p.id
FROM permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON roles TO authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON role_permissions TO authenticated;

-- ============================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE roles IS 'User roles for RBAC system';
COMMENT ON TABLE permissions IS 'Available permissions in the system';
COMMENT ON TABLE role_permissions IS 'Junction table mapping roles to permissions';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted';
COMMENT ON COLUMN permissions.resource IS 'Resource this permission applies to (e.g., work_orders)';
COMMENT ON COLUMN permissions.action IS 'Action type (create, read, update, delete, manage, assign)';
