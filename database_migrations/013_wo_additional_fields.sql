-- Migration: Add WO Owner, Shipment Status, and Job Status fields to work_orders
-- Date: 2024-12-19

-- Add new columns to work_orders table
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shipment_status TEXT,
ADD COLUMN IF NOT EXISTS job_status TEXT DEFAULT 'Open',
ADD COLUMN IF NOT EXISTS job_status_reason TEXT;

-- Add CHECK constraint for job_status (if not exists, we drop and recreate)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_job_status_check'
    ) THEN
        ALTER TABLE work_orders
        ADD CONSTRAINT work_orders_job_status_check 
        CHECK (job_status IN ('Open', 'Active', 'On Hold', 'Completed', 'Submitted', 'Invoiced', 'Cancelled'));
    END IF;
END $$;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_work_orders_job_status ON work_orders(job_status);
CREATE INDEX IF NOT EXISTS idx_work_orders_owner_id ON work_orders(owner_id);

-- Update existing work orders to have 'Open' status if null
UPDATE work_orders SET job_status = 'Open' WHERE job_status IS NULL;

-- Set owner_id to uploaded_by for existing records where owner_id is null
UPDATE work_orders SET owner_id = uploaded_by WHERE owner_id IS NULL AND uploaded_by IS NOT NULL;
