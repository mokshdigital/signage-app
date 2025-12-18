-- Migration 011: Work Order Requirements Fields
-- Adds skills, permits, equipment, and materials as array columns

ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS skills_required TEXT[],
ADD COLUMN IF NOT EXISTS permits_required TEXT[],
ADD COLUMN IF NOT EXISTS equipment_required TEXT[],
ADD COLUMN IF NOT EXISTS materials_required TEXT[];

-- Add Gin index for faster array searching (e.g. finding orders requiring specific skill)
CREATE INDEX IF NOT EXISTS idx_work_orders_skills_required ON work_orders USING GIN (skills_required);
CREATE INDEX IF NOT EXISTS idx_work_orders_permits_required ON work_orders USING GIN (permits_required);
