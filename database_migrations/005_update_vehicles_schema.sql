-- Add new columns to the vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS make text,
ADD COLUMN IF NOT EXISTS driver text,
ADD COLUMN IF NOT EXISTS registration text,
ADD COLUMN IF NOT EXISTS gross_weight text,
ADD COLUMN IF NOT EXISTS vin text;

-- Add comments for documentation
COMMENT ON COLUMN vehicles.make IS 'Vehicle make/manufacturer (e.g., Ford, Toyota)';
COMMENT ON COLUMN vehicles.driver IS 'Name of the assigned driver';
COMMENT ON COLUMN vehicles.registration IS 'Vehicle registration number';
COMMENT ON COLUMN vehicles.gross_weight IS 'Gross Vehicle Weight (GVW)';
COMMENT ON COLUMN vehicles.vin IS 'Vehicle Identification Number';
