-- Migration: 030_client_hub_schema.sql
-- Description: Creates tables for Client Hub - client communication and access control
-- Date: 2024-12-23

-- =============================================
-- ACCESS CHECK HELPER FUNCTION
-- =============================================

-- Unified function to check if a user can access the Client Hub for a specific work order
CREATE OR REPLACE FUNCTION can_access_client_hub(wo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN (
        -- 1. Is WO owner
        EXISTS (
            SELECT 1 FROM work_orders 
            WHERE id = wo_id AND owner_id = current_user_id
        )
        OR
        -- 2. Is internal team member (non-technician) in work_order_team
        EXISTS (
            SELECT 1 FROM work_order_team wot
            JOIN user_profiles up ON up.id = wot.user_profile_id
            JOIN roles r ON r.id = up.role_id
            WHERE wot.work_order_id = wo_id
              AND wot.user_profile_id = current_user_id
              AND up.user_type = 'internal'
              AND LOWER(r.name) != 'technician'
        )
        OR
        -- 3. Is the Primary PM (work_orders.pm_id -> project_managers.user_profile_id)
        EXISTS (
            SELECT 1 FROM work_orders wo
            JOIN project_managers pm ON pm.id = wo.pm_id
            WHERE wo.id = wo_id AND pm.user_profile_id = current_user_id
        )
        OR
        -- 4. Is an Additional PM in work_order_client_access
        EXISTS (
            SELECT 1 FROM work_order_client_access woca
            JOIN project_managers pm ON pm.id = woca.project_manager_id
            WHERE woca.work_order_id = wo_id
              AND pm.user_profile_id = current_user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- WORK ORDER CLIENT ACCESS TABLE
-- Junction table for additional client contacts
-- =============================================

CREATE TABLE IF NOT EXISTS work_order_client_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    project_manager_id UUID NOT NULL REFERENCES project_managers(id) ON DELETE CASCADE,
    added_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each PM can only be added once per work order
    UNIQUE(work_order_id, project_manager_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_access_work_order ON work_order_client_access(work_order_id);
CREATE INDEX IF NOT EXISTS idx_client_access_pm ON work_order_client_access(project_manager_id);

-- =============================================
-- WORK ORDER CLIENT CHAT TABLE
-- Dedicated table for client-facing communication
-- =============================================

CREATE TABLE IF NOT EXISTS work_order_client_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id),
    message TEXT NOT NULL CHECK (LENGTH(message) > 0 AND LENGTH(message) <= 2000),
    file_references UUID[] DEFAULT '{}', -- References to work_order_files
    
    -- Denormalized for display performance
    sender_company_name TEXT, -- "Tops Lighting" for internal, client company name for external
    
    -- Soft delete support
    is_deleted BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_chat_work_order ON work_order_client_chat(work_order_id);
CREATE INDEX IF NOT EXISTS idx_client_chat_sender ON work_order_client_chat(sender_id);
CREATE INDEX IF NOT EXISTS idx_client_chat_created ON work_order_client_chat(work_order_id, created_at);

-- =============================================
-- RLS POLICIES FOR work_order_client_access
-- =============================================

ALTER TABLE work_order_client_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_access_select" ON work_order_client_access;
CREATE POLICY "client_access_select" ON work_order_client_access
FOR SELECT TO authenticated
USING (can_access_client_hub(work_order_id));

DROP POLICY IF EXISTS "client_access_insert" ON work_order_client_access;
CREATE POLICY "client_access_insert" ON work_order_client_access
FOR INSERT TO authenticated
WITH CHECK (can_access_client_hub(work_order_id));

DROP POLICY IF EXISTS "client_access_delete" ON work_order_client_access;
CREATE POLICY "client_access_delete" ON work_order_client_access
FOR DELETE TO authenticated
USING (can_access_client_hub(work_order_id));

-- =============================================
-- RLS POLICIES FOR work_order_client_chat
-- =============================================

ALTER TABLE work_order_client_chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_chat_select" ON work_order_client_chat;
CREATE POLICY "client_chat_select" ON work_order_client_chat
FOR SELECT TO authenticated
USING (can_access_client_hub(work_order_id) AND is_deleted = FALSE);

DROP POLICY IF EXISTS "client_chat_insert" ON work_order_client_chat;
CREATE POLICY "client_chat_insert" ON work_order_client_chat
FOR INSERT TO authenticated
WITH CHECK (
    can_access_client_hub(work_order_id) 
    AND sender_id = auth.uid()
);

DROP POLICY IF EXISTS "client_chat_update" ON work_order_client_chat;
CREATE POLICY "client_chat_update" ON work_order_client_chat
FOR UPDATE TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- =============================================
-- ENABLE REALTIME FOR CLIENT CHAT
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE work_order_client_chat;

-- =============================================
-- NEW RBAC PERMISSION FOR MANAGING CLIENT CONTACTS
-- =============================================

INSERT INTO permissions (name, description, resource, action)
VALUES ('client_hub:manage_contacts', 'Add or remove additional client contacts on work orders', 'client_hub', 'manage_contacts')
ON CONFLICT (name) DO NOTHING;

-- Grant to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin' AND p.name = 'client_hub:manage_contacts'
ON CONFLICT DO NOTHING;

-- Grant to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'client_hub:manage_contacts'
ON CONFLICT DO NOTHING;
