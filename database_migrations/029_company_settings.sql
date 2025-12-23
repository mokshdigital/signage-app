-- Migration: 029_company_settings.sql
-- Description: Creates company_settings table for storing company information
-- Date: 2024-12-23

-- =============================================
-- COMPANY SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Enforces single row
    
    -- Basic Info
    name TEXT NOT NULL DEFAULT 'Tops Lighting',
    logo_url TEXT,
    
    -- Contact Info
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'USA',
    
    -- Business Info
    tax_id TEXT,  -- EIN / Business Number
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEED DEFAULT COMPANY
-- =============================================

INSERT INTO company_settings (id, name) 
VALUES (1, 'Tops Lighting')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read company settings
DROP POLICY IF EXISTS "Allow authenticated read on company_settings" ON company_settings;
CREATE POLICY "Allow authenticated read on company_settings"
ON company_settings FOR SELECT
TO authenticated
USING (true);

-- Only users with settings:manage_company permission can update
-- For now, allow any authenticated user to update (will enforce via UI/service layer)
DROP POLICY IF EXISTS "Allow authenticated update on company_settings" ON company_settings;
CREATE POLICY "Allow authenticated update on company_settings"
ON company_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- NEW PERMISSION
-- =============================================

INSERT INTO permissions (name, description, module)
VALUES ('settings:manage_company', 'Manage company information and branding', 'settings')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- GRANT PERMISSION TO SUPER ADMIN
-- =============================================

-- Add the new permission to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin' AND p.name = 'settings:manage_company'
ON CONFLICT DO NOTHING;

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_company_settings_updated_at ON company_settings;
CREATE TRIGGER trigger_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_settings_updated_at();
