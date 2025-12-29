-- Migration: 037_clients_permissions.sql
-- Purpose: Add dedicated clients:* permissions for the Clients module
-- Date: 2025-12-29

-- ============================================================================
-- 1. CREATE CLIENTS PERMISSIONS
-- ============================================================================

INSERT INTO permissions (name, description, resource, action)
VALUES 
    ('clients:create', 'Create new client records', 'clients', 'create'),
    ('clients:read', 'View client list and details', 'clients', 'read'),
    ('clients:update', 'Update client information and manage contacts', 'clients', 'update'),
    ('clients:delete', 'Delete client records and contacts', 'clients', 'delete'),
    ('clients:manage', 'Full control over clients (includes portal account creation)', 'clients', 'manage')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. ASSIGN PERMISSIONS TO SUPER_ADMIN (all 5)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND p.name IN ('clients:create', 'clients:read', 'clients:update', 'clients:delete', 'clients:manage')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. ASSIGN PERMISSIONS TO ADMIN (all 5)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.name IN ('clients:create', 'clients:read', 'clients:update', 'clients:delete', 'clients:manage')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. ASSIGN PERMISSIONS TO PROJECT_COORDINATOR (read, create, update)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'project_coordinator' 
  AND p.name IN ('clients:create', 'clients:read', 'clients:update')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ASSIGN PERMISSIONS TO SUPERVISOR (read only)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'supervisor' 
  AND p.name = 'clients:read'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY (run after migration to confirm)
-- ============================================================================
-- SELECT r.name as role, array_agg(p.name ORDER BY p.name) as permissions
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.resource = 'clients'
-- GROUP BY r.name;
