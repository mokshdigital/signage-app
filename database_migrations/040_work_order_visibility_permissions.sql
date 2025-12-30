-- Migration: 040_work_order_visibility_permissions.sql
-- Purpose: Add permissions for controlling work order list visibility
-- Date: 2025-12-30

-- ============================================================================
-- 1. CREATE WORK ORDER VISIBILITY PERMISSIONS
-- ============================================================================
-- These permissions control what work orders a user can see in the list view.
-- - view_all: User can see ALL work orders in the system
-- - view_assigned: User can only see work orders where they are:
--   1. The WO Owner (owner_id)
--   2. An assigned Technician (work_order_assignments)
--   3. A Team Member (work_order_team)

INSERT INTO permissions (name, description, resource, action)
VALUES 
    ('work_orders:view_all', 'View all work orders in the system', 'work_orders', 'view_all'),
    ('work_orders:view_assigned', 'View only work orders assigned to the user', 'work_orders', 'view_assigned')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. ASSIGN view_all TO SUPER_ADMIN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND p.name = 'work_orders:view_all'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. ASSIGN view_all TO ADMIN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.name = 'work_orders:view_all'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. ASSIGN view_all TO SUPERVISOR
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'supervisor' 
  AND p.name = 'work_orders:view_all'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ASSIGN view_all TO PROJECT_COORDINATOR
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'project_coordinator' 
  AND p.name = 'work_orders:view_all'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. ASSIGN view_assigned TO TECHNICIAN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'technician' 
  AND p.name = 'work_orders:view_assigned'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY (run after migration to check)
-- ============================================================================
-- SELECT r.name as role, array_agg(p.name ORDER BY p.name) as permissions
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.name LIKE 'work_orders:view%'
-- GROUP BY r.name
-- ORDER BY r.name;
