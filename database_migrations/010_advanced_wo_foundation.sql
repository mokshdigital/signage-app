-- Migration 010: Advanced Work Order Foundation, Logistics & WO Numbering
-- Sub-Phase A: Enhanced work order system with assignments and shipments
-- Created: 2025-12-18

-- ============================================
-- STEP 1: Create job_types table
-- Categorizes work orders by job type
-- ============================================

CREATE TABLE IF NOT EXISTS job_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for name lookups
CREATE INDEX IF NOT EXISTS idx_job_types_name ON job_types(name);

-- Enable RLS
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on job_types"
    ON job_types FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all inserts on job_types"
    ON job_types FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all updates on job_types"
    ON job_types FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on job_types"
    ON job_types FOR DELETE
    TO anon, authenticated
    USING (true);

-- Seed common job types
INSERT INTO job_types (name, description) VALUES
    ('Installation', 'New signage installation'),
    ('Service', 'Maintenance and repair'),
    ('Survey', 'Site survey and assessment'),
    ('Removal', 'Sign removal and decommission'),
    ('Fabrication', 'Custom sign fabrication'),
    ('Electrical', 'Electrical work for signage'),
    ('Permit', 'Permit acquisition and compliance')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 2: Update work_orders table
-- Add WO number, dates, site address, and job type
-- ============================================

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS work_order_number TEXT;

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS job_type_id UUID REFERENCES job_types(id) ON DELETE SET NULL;

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS site_address TEXT;

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS planned_date DATE;

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS work_order_date DATE;

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_work_orders_work_order_number ON work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_job_type_id ON work_orders(job_type_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_planned_date ON work_orders(planned_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_work_order_date ON work_orders(work_order_date);

-- ============================================
-- STEP 3: Create work_order_assignments table
-- Junction table for technician assignments
-- ============================================

CREATE TABLE IF NOT EXISTS work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(work_order_id, technician_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_wo_assignments_work_order_id ON work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_technician_id ON work_order_assignments(technician_id);

-- Enable RLS
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on work_order_assignments"
    ON work_order_assignments FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all inserts on work_order_assignments"
    ON work_order_assignments FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all updates on work_order_assignments"
    ON work_order_assignments FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on work_order_assignments"
    ON work_order_assignments FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- STEP 4: Create work_order_shipments table
-- Tracks shipments and receiving accountability
-- ============================================

CREATE TABLE IF NOT EXISTS work_order_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    tracking_id TEXT,                              -- Carrier tracking number
    contents TEXT,                                 -- Description of shipment contents
    status_location TEXT DEFAULT 'In Transit',    -- Current status/location (manual text)
    received_by_id UUID,                           -- Generic reference (could be technician or office_staff)
    received_by_type TEXT,                         -- 'technician' or 'office_staff'
    received_at TIMESTAMPTZ,                       -- When shipment was received
    receipt_photos TEXT[],                         -- Array of photo URLs
    notes TEXT,                                    -- Additional notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_wo_shipments_work_order_id ON work_order_shipments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_shipments_tracking_id ON work_order_shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_wo_shipments_status_location ON work_order_shipments(status_location);
CREATE INDEX IF NOT EXISTS idx_wo_shipments_received_at ON work_order_shipments(received_at);

-- Enable RLS
ALTER TABLE work_order_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on work_order_shipments"
    ON work_order_shipments FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all inserts on work_order_shipments"
    ON work_order_shipments FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all updates on work_order_shipments"
    ON work_order_shipments FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on work_order_shipments"
    ON work_order_shipments FOR DELETE
    TO anon, authenticated
    USING (true);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_shipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shipment_updated_at_trigger ON work_order_shipments;
CREATE TRIGGER shipment_updated_at_trigger
    BEFORE UPDATE ON work_order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_shipment_updated_at();

-- ============================================
-- STEP 5: Create storage bucket for shipment photos
-- Note: Run this in Supabase dashboard or via API
-- ============================================

-- The following SQL creates the bucket policy if bucket is created via dashboard:
-- Bucket name: shipment-photos
-- Public: Yes (for easy image display)

-- Run these after creating the bucket in Supabase dashboard:
/*
-- Allow anyone to upload
CREATE POLICY "Allow all uploads to shipment-photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'shipment-photos');

-- Allow anyone to read
CREATE POLICY "Allow all reads from shipment-photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'shipment-photos');

-- Allow anyone to delete
CREATE POLICY "Allow all deletes from shipment-photos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'shipment-photos');
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- New tables: job_types, work_order_assignments, work_order_shipments
-- Updated tables: work_orders (added work_order_number, job_type_id, site_address, planned_date, work_order_date)
-- RLS: Enabled with permissive policies
-- Note: Create 'shipment-photos' storage bucket in Supabase dashboard
