-- Add recommended_techs column to work_orders table
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS recommended_techs INTEGER DEFAULT NULL;
