-- Migration: File Categories System
-- Date: December 19, 2024
-- Description: Adds file categorization support with RBAC levels

-- 1. Create file_categories table
CREATE TABLE IF NOT EXISTS file_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES file_categories(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT FALSE,
    rbac_level TEXT NOT NULL DEFAULT 'office' CHECK (rbac_level IN ('office', 'field', 'office_only')),
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique category names per work order (for top level) or per parent (for subcategories)
    -- This constraint might be tricky with null parent_id, so we'll enforce unique name per work order + parent combination via logic or partial index if needed.
    -- For now, simple unique constraint on (work_order_id, parent_id, name) where parent_id is handled (coalesce not standard in unique index without extra work).
    -- Let's stick to valid application logic or a unique index with COALESCE if strictly needed, but simple (work_order_id, name) might be too restrictive if subcategories have same name as root.
    -- Actually, (work_order_id, name, parent_id) is what we want. In Postgres, NULL != NULL in unique constraints.
    -- So we'll accept duplicates for now or manage via app logic to avoid complex index syntax in this migration.
    CONSTRAINT unique_category_name_per_parent UNIQUE NULLS NOT DISTINCT (work_order_id, parent_id, name)
);

-- 2. Add columns to work_order_files
ALTER TABLE work_order_files 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES file_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Note: work_order_files already has created_at, which serves as uploaded_at.

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_file_categories_work_order_id ON file_categories(work_order_id);
CREATE INDEX IF NOT EXISTS idx_file_categories_parent_id ON file_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_work_order_files_category_id ON work_order_files(category_id);
CREATE INDEX IF NOT EXISTS idx_work_order_files_uploaded_by ON work_order_files(uploaded_by);

-- 4. Enable RLS
ALTER TABLE file_categories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for file_categories

-- ALLOW READ: Authenticated users can read categories for work orders they have access to
-- (For now, permissive read access for all authenticated users to simplify)
CREATE POLICY "Allow authenticated reads" ON file_categories
    FOR SELECT TO authenticated USING (true);

-- ALLOW INSERT/UPDATE/DELETE: Based on application logic, but for now allow authenticated
-- We will enforce RBAC in the service layer/API, but base DB policy:
CREATE POLICY "Allow authenticated modification" ON file_categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Insert new Permissions (if using the permissions table from RBAC phase)
-- Assuming 'permissions' table exists from previous migrations
INSERT INTO permissions (name, description, resource, action) VALUES
    ('files:manage_office', 'Manage office-level file categories', 'work_orders', 'manage_office_files'),
    ('files:manage_field', 'Manage field-level file categories', 'work_orders', 'manage_field_files'),
    ('files:view_office_only', 'View office-only file categories', 'work_orders', 'view_office_files')
ON CONFLICT (name) DO NOTHING;

-- 7. Grant default permissions to 'super_admin' (assuming role exists)
-- Find role id for super_admin and insert
DO $$
DECLARE
    super_admin_id UUID;
    perm_id_office UUID;
    perm_id_field UUID;
    perm_id_view UUID;
BEGIN
    SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO perm_id_office FROM permissions WHERE name = 'files:manage_office';
    SELECT id INTO perm_id_field FROM permissions WHERE name = 'files:manage_field';
    SELECT id INTO perm_id_view FROM permissions WHERE name = 'files:view_office_only';

    IF super_admin_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        (super_admin_id, perm_id_office),
        (super_admin_id, perm_id_field),
        (super_admin_id, perm_id_view)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
