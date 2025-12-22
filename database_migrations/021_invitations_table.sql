-- Invitations table for pre-registering users
-- When users sign in with Google, auth callback checks this table and creates their profile

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    nick_name TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    is_technician BOOLEAN DEFAULT false,
    is_office_staff BOOLEAN DEFAULT false,
    skills TEXT[],
    job_title TEXT,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    claimed_at TIMESTAMPTZ,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- RLS policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read invitations
CREATE POLICY "Authenticated users can read invitations" ON invitations
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert invitations (for admins)
CREATE POLICY "Authenticated users can insert invitations" ON invitations
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update invitations (for claiming)
CREATE POLICY "Authenticated users can update invitations" ON invitations
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Authenticated users can delete invitations
CREATE POLICY "Authenticated users can delete invitations" ON invitations
    FOR DELETE
    USING (auth.uid() IS NOT NULL);
