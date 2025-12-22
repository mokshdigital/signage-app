-- Migration 018: Work Order Scheduling Fields
-- Adds: estimated_days, scheduling_notes, planned_dates array
-- Drops: planned_date (single date)

-- 1. Add new columns
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS estimated_days integer;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS scheduling_notes text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS planned_dates date[];
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS review_needed boolean DEFAULT true;

-- 2. Migrate existing planned_date to array
UPDATE work_orders 
SET planned_dates = ARRAY[planned_date]::date[] 
WHERE planned_date IS NOT NULL AND planned_dates IS NULL;

-- 3. Drop old planned_date column
ALTER TABLE work_orders DROP COLUMN IF EXISTS planned_date;

-- 4. Add comments for documentation
COMMENT ON COLUMN work_orders.estimated_days IS 'Estimated number of days needed for the job';
COMMENT ON COLUMN work_orders.scheduling_notes IS 'Special scheduling needs (e.g., weekend only, after hours)';
COMMENT ON COLUMN work_orders.planned_dates IS 'Array of planned installation/work dates';
