-- Migration 026: Simplify User Types to Internal/External
-- This migration:
-- 1. Adds user_type column to user_profiles (single value: 'internal' | 'external')
-- 2. Adds user_type column to roles (which type can have this role)
-- 3. Populates data from existing user_types[] array
-- 4. Seeds system roles with is_system = true
-- 5. Assigns appropriate roles to existing users
-- 6. Drops the old user_types[] column

-- =============================================================================
-- STEP 1: Add new columns (nullable initially for safe migration)
-- =============================================================================

-- Add user_type to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Add user_type to roles
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS user_type TEXT;

-- =============================================================================
-- STEP 2: Populate user_type in user_profiles based on existing user_types[]
-- =============================================================================

-- Set internal for office_staff and technicians
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_types') THEN
        -- Set internal for office_staff and technicians
        UPDATE user_profiles 
        SET user_type = 'internal'
        WHERE user_types IS NOT NULL 
          AND ('office_staff' = ANY(user_types) OR 'technician' = ANY(user_types));

        -- Set external for clients
        UPDATE user_profiles 
        SET user_type = 'external'
        WHERE user_types IS NOT NULL 
          AND 'client' = ANY(user_types);
    END IF;
END $$;

-- Default any remaining NULL to internal (safeguard)
UPDATE user_profiles 
SET user_type = 'internal'
WHERE user_type IS NULL;

-- =============================================================================
-- STEP 3: Populate user_type in roles based on role name
-- =============================================================================

-- Default all existing roles to internal
UPDATE roles 
SET user_type = 'internal'
WHERE user_type IS NULL;

-- =============================================================================
-- STEP 4: Seed system roles (upsert - insert or update if exists)
-- =============================================================================

-- Internal roles
INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'super_admin', 'Super Admin', 'Full system access - cannot be restricted', true, 'internal', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'internal',
  updated_at = NOW();

INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin', 'Admin', 'Administrative access - user and settings management', true, 'internal', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'internal',
  updated_at = NOW();

INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'supervisor', 'Supervisor', 'Oversee work orders, assign technicians, approve work', true, 'internal', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'internal',
  updated_at = NOW();

INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'technician', 'Technician', 'Field worker - view and complete assigned work orders', true, 'internal', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'internal',
  updated_at = NOW();

INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'project_coordinator', 'Project Coordinator', 'Manage work orders and coordinate with clients', true, 'internal', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'internal',
  updated_at = NOW();

-- External roles
INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'client', 'Client', 'External customer - view their work orders', true, 'external', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'external',
  updated_at = NOW();

INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'subcontractor', 'Sub-contractor', 'External field worker - view assigned work orders', true, 'external', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'external',
  updated_at = NOW();

INSERT INTO roles (id, name, display_name, description, is_system, user_type, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'vendor', 'Vendor', 'External vendor - limited access for shipments', true, 'external', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  is_system = true,
  user_type = 'external',
  updated_at = NOW();

-- =============================================================================
-- STEP 5: Assign roles to existing users based on old user_types
-- =============================================================================

-- Users with both office_staff AND technician → Project Coordinator
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_types') THEN
        -- Users with both office_staff AND technician → Project Coordinator
        UPDATE user_profiles 
        SET role_id = (SELECT id FROM roles WHERE name = 'project_coordinator')
        WHERE user_types IS NOT NULL
          AND 'office_staff' = ANY(user_types) 
          AND 'technician' = ANY(user_types)
          AND role_id IS NULL;

        -- Users with only technician → Technician role (if no role assigned)
        UPDATE user_profiles 
        SET role_id = (SELECT id FROM roles WHERE name = 'technician')
        WHERE user_types IS NOT NULL
          AND 'technician' = ANY(user_types) 
          AND NOT ('office_staff' = ANY(user_types))
          AND role_id IS NULL;

        -- Users with only client → Client role (if no role assigned)
        UPDATE user_profiles 
        SET role_id = (SELECT id FROM roles WHERE name = 'client')
        WHERE user_types IS NOT NULL
          AND 'client' = ANY(user_types)
          AND role_id IS NULL;
    END IF;
END $$;

-- =============================================================================
-- STEP 6: Add constraints
-- =============================================================================

-- Make user_type NOT NULL with CHECK constraint
ALTER TABLE user_profiles 
ALTER COLUMN user_type SET NOT NULL;

ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS check_user_type;

ALTER TABLE user_profiles 
ADD CONSTRAINT check_user_type 
CHECK (user_type IN ('internal', 'external'));

-- Make roles.user_type NOT NULL with CHECK constraint
ALTER TABLE roles 
ALTER COLUMN user_type SET NOT NULL;

ALTER TABLE roles 
DROP CONSTRAINT IF EXISTS check_role_user_type;

ALTER TABLE roles 
ADD CONSTRAINT check_role_user_type 
CHECK (user_type IN ('internal', 'external'));

-- =============================================================================
-- STEP 7: Drop old user_types array column
-- =============================================================================

ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS user_types;

-- =============================================================================
-- STEP 8: Add index for efficient queries
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_roles_user_type ON roles(user_type);

-- =============================================================================
-- VERIFICATION QUERIES (run manually to check results)
-- =============================================================================

-- Check user_profiles distribution:
-- SELECT user_type, COUNT(*) FROM user_profiles GROUP BY user_type;

-- Check roles:
-- SELECT name, display_name, user_type, is_system FROM roles ORDER BY user_type, name;

-- Check users with roles:
-- SELECT up.display_name, up.user_type, r.name as role_name 
-- FROM user_profiles up 
-- LEFT JOIN roles r ON up.role_id = r.id;
