-- Migration: Add is_client_visible flag to work_order_files
-- This allows per-file control over what clients can see in the portal

-- Add column to work_order_files
ALTER TABLE work_order_files
ADD COLUMN IF NOT EXISTS is_client_visible BOOLEAN DEFAULT FALSE;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_work_order_files_client_visible 
ON work_order_files(work_order_id, is_client_visible) 
WHERE is_client_visible = TRUE;

-- Comment for documentation
COMMENT ON COLUMN work_order_files.is_client_visible IS 
'When TRUE, this file is visible to external clients in the Client Portal';
