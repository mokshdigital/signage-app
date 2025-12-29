-- Fix: Add missing roles:manage and users:manage permissions to super_admin and admin roles
-- These permissions were created but never assigned to roles

BEGIN;

-- Add to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
AND p.name IN ('roles:manage', 'users:manage')
ON CONFLICT DO NOTHING;

-- Add to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN ('roles:manage', 'users:manage')
ON CONFLICT DO NOTHING;

COMMIT;
