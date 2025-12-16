-- Create office_staff table
CREATE TABLE IF NOT EXISTS office_staff (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text,
    phone text,
    title text,
    created_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE office_staff IS 'Directory of office staff members';
COMMENT ON COLUMN office_staff.name IS 'Full name of the staff member';
COMMENT ON COLUMN office_staff.title IS 'Job title or role';

-- Enable Row Level Security
ALTER TABLE office_staff ENABLE ROW LEVEL SECURITY;

-- Create policies (start with permissive for authenticated users for now, matching other tables)
CREATE POLICY "Enable read access for authenticated users" ON office_staff
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable all access for authenticated users" ON office_staff
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
