-- Migration 009: Clients and Project Managers
-- Phase 11: Client Management System
-- Created: 2025-12-18

-- ============================================
-- STEP 1: Create clients table
-- Stores corporate client entities
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,           -- Registered office address
    notes TEXT,             -- General notes about the client
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- ============================================
-- STEP 2: Create project_managers table
-- Stores client contacts (Project Managers)
-- These are EXTERNAL contacts, not internal office_staff
-- ============================================

CREATE TABLE IF NOT EXISTS project_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for project_managers
CREATE INDEX IF NOT EXISTS idx_project_managers_client_id ON project_managers(client_id);
CREATE INDEX IF NOT EXISTS idx_project_managers_name ON project_managers(name);
CREATE INDEX IF NOT EXISTS idx_project_managers_email ON project_managers(email);

-- ============================================
-- STEP 3: Update work_orders table
-- Add client and PM assignment columns
-- ============================================

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS pm_id UUID REFERENCES project_managers(id) ON DELETE SET NULL;

-- Indexes for work order assignments
CREATE INDEX IF NOT EXISTS idx_work_orders_client_id ON work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_pm_id ON work_orders(pm_id);

-- ============================================
-- STEP 4: Enable RLS on new tables
-- Using permissive policies consistent with other tables
-- ============================================

-- Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on clients"
    ON clients FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all inserts on clients"
    ON clients FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all updates on clients"
    ON clients FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on clients"
    ON clients FOR DELETE
    TO anon, authenticated
    USING (true);

-- Enable RLS on project_managers
ALTER TABLE project_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on project_managers"
    ON project_managers FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all inserts on project_managers"
    ON project_managers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all updates on project_managers"
    ON project_managers FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on project_managers"
    ON project_managers FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- STEP 5: Sample seed data (optional, for testing)
-- ============================================

-- Uncomment to insert sample data:
/*
INSERT INTO clients (name, address, notes) VALUES
    ('Acme Corporation', '123 Main Street, Suite 100, New York, NY 10001', 'Major signage client since 2020'),
    ('TechStart Inc.', '456 Innovation Blvd, San Jose, CA 95110', 'Growing startup, frequent small orders');

-- Get the IDs of the inserted clients and add PMs
-- This would need to be done after getting the actual UUIDs
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- New tables: clients, project_managers
-- Updated tables: work_orders (added client_id, pm_id)
-- RLS: Enabled with permissive policies
