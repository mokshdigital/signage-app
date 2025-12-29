-- Migration: 039_granular_task_permissions.sql
-- Purpose: Replace jobs:tasks:manage with 13 granular task permissions
-- Date: 2025-12-29

-- ============================================================================
-- 1. REMOVE OLD jobs:tasks:manage PERMISSION
-- ============================================================================

-- First remove role assignments for the old permission
DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE name = 'jobs:tasks:manage'
);

-- Then remove the permission itself
DELETE FROM permissions WHERE name = 'jobs:tasks:manage';

-- ============================================================================
-- 2. CREATE NEW GRANULAR TASK PERMISSIONS (13 total)
-- ============================================================================

INSERT INTO permissions (name, description, resource, action)
VALUES 
    -- Task CRUD
    ('jobs:tasks:create', 'Create new tasks', 'jobs', 'tasks:create'),
    ('jobs:tasks:edit', 'Edit task name, description, priority, due date, category, tags', 'jobs', 'tasks:edit'),
    ('jobs:tasks:delete', 'Delete tasks', 'jobs', 'tasks:delete'),
    ('jobs:tasks:assign', 'Assign/unassign technicians to tasks', 'jobs', 'tasks:assign'),
    ('jobs:tasks:status', 'Change task status (Pending/In Progress/Done)', 'jobs', 'tasks:status'),
    ('jobs:tasks:block', 'Mark task as Blocked and set block reason', 'jobs', 'tasks:block'),
    
    -- Task Comments
    ('jobs:tasks:comment', 'Add comments to tasks', 'jobs', 'tasks:comment'),
    ('jobs:tasks:comment:edit_own', 'Edit own task comments', 'jobs', 'tasks:comment:edit_own'),
    ('jobs:tasks:comment:delete_own', 'Delete own task comments', 'jobs', 'tasks:comment:delete_own'),
    
    -- Task Checklists
    ('jobs:tasks:checklist:add', 'Add checklist items to tasks', 'jobs', 'tasks:checklist:add'),
    ('jobs:tasks:checklist:toggle', 'Toggle checklist item complete/incomplete', 'jobs', 'tasks:checklist:toggle'),
    ('jobs:tasks:checklist:edit', 'Edit checklist item content', 'jobs', 'tasks:checklist:edit'),
    ('jobs:tasks:checklist:delete', 'Delete checklist items', 'jobs', 'tasks:checklist:delete')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. ASSIGN ALL TASK PERMISSIONS TO SUPER_ADMIN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND p.name LIKE 'jobs:tasks:%'
  AND p.name != 'jobs:tasks:view'  -- Already assigned in previous migration
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. ASSIGN ALL TASK PERMISSIONS TO ADMIN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.name LIKE 'jobs:tasks:%'
  AND p.name != 'jobs:tasks:view'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ASSIGN PERMISSIONS TO SUPERVISOR (all task permissions)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'supervisor' 
  AND p.name LIKE 'jobs:tasks:%'
  AND p.name != 'jobs:tasks:view'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. ASSIGN PERMISSIONS TO PROJECT_COORDINATOR
-- (All except delete tasks and delete checklists)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'project_coordinator' 
  AND p.name IN (
    'jobs:tasks:create',
    'jobs:tasks:edit',
    'jobs:tasks:assign',
    'jobs:tasks:status',
    'jobs:tasks:block',
    'jobs:tasks:comment',
    'jobs:tasks:comment:edit_own',
    'jobs:tasks:comment:delete_own',
    'jobs:tasks:checklist:add',
    'jobs:tasks:checklist:toggle',
    'jobs:tasks:checklist:edit'
    -- NOT: jobs:tasks:delete, jobs:tasks:checklist:delete
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ASSIGN PERMISSIONS TO TECHNICIAN
-- (Status, comments, checklists - but NOT create/edit/delete/assign/block tasks or delete checklists)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'technician' 
  AND p.name IN (
    'jobs:tasks:status',           -- Can change to Pending/In Progress/Done
    'jobs:tasks:comment',          -- Can add comments
    'jobs:tasks:comment:edit_own', -- Can edit own comments
    'jobs:tasks:comment:delete_own', -- Can delete own comments
    'jobs:tasks:checklist:add',    -- Can add checklist items
    'jobs:tasks:checklist:toggle', -- Can toggle checklist items
    'jobs:tasks:checklist:edit'    -- Can edit checklist content
    -- NOT: create, edit, delete, assign, block, checklist:delete
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY (run after migration to check)
-- ============================================================================
-- SELECT r.name as role, array_agg(p.name ORDER BY p.name) as permissions
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.name LIKE 'jobs:tasks:%'
-- GROUP BY r.name
-- ORDER BY r.name;
