-- Migration: 038_jobs_tab_permissions.sql
-- Purpose: Add granular permissions for Job Detail page tabs
-- Date: 2025-12-29

-- ============================================================================
-- 1. CREATE JOBS TAB PERMISSIONS (12 total)
-- ============================================================================

INSERT INTO permissions (name, description, resource, action)
VALUES 
    -- Requirements Tab
    ('jobs:requirements:view', 'View job requirements tab', 'jobs', 'requirements:view'),
    ('jobs:requirements:edit', 'Edit job requirements', 'jobs', 'requirements:edit'),
    
    -- Tasks Tab
    ('jobs:tasks:view', 'View job tasks tab', 'jobs', 'tasks:view'),
    ('jobs:tasks:manage', 'Create, edit, delete tasks and checklists', 'jobs', 'tasks:manage'),
    
    -- Technicians Tab
    ('jobs:technicians:view', 'View assigned technicians', 'jobs', 'technicians:view'),
    ('jobs:technicians:assign', 'Assign or unassign technicians', 'jobs', 'technicians:assign'),
    
    -- Team Tab
    ('jobs:team:view', 'View team roster and chat', 'jobs', 'team:view'),
    ('jobs:team:manage', 'Manage team members and send chat messages', 'jobs', 'team:manage'),
    
    -- Files Tab
    ('jobs:files:view', 'View job files', 'jobs', 'files:view'),
    ('jobs:files:manage', 'Upload, move, and delete files', 'jobs', 'files:manage'),
    
    -- Shipments Tab
    ('jobs:shipments:view', 'View shipments and tracking', 'jobs', 'shipments:view'),
    ('jobs:shipments:manage', 'Add, edit shipments and comments', 'jobs', 'shipments:manage')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. ASSIGN ALL PERMISSIONS TO SUPER_ADMIN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND p.name LIKE 'jobs:%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. ASSIGN ALL PERMISSIONS TO ADMIN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.name LIKE 'jobs:%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. ASSIGN ALL PERMISSIONS TO SUPERVISOR
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'supervisor' 
  AND p.name LIKE 'jobs:%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ASSIGN PERMISSIONS TO PROJECT_COORDINATOR
-- (All view + requirements/tasks/files/shipments manage)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'project_coordinator' 
  AND p.name IN (
    -- All view permissions
    'jobs:requirements:view',
    'jobs:tasks:view',
    'jobs:technicians:view',
    'jobs:team:view',
    'jobs:files:view',
    'jobs:shipments:view',
    -- Manage permissions (not technicians:assign or team:manage)
    'jobs:requirements:edit',
    'jobs:tasks:manage',
    'jobs:files:manage',
    'jobs:shipments:manage'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. ASSIGN PERMISSIONS TO TECHNICIAN
-- (Tasks view/manage + Team view/manage only)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'technician' 
  AND p.name IN (
    'jobs:tasks:view',
    'jobs:tasks:manage',
    'jobs:team:view',
    'jobs:team:manage'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY (run after migration to check)
-- ============================================================================
-- SELECT r.name as role, array_agg(p.name ORDER BY p.name) as permissions
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.name LIKE 'jobs:%'
-- GROUP BY r.name
-- ORDER BY r.name;
