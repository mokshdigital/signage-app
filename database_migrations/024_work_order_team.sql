-- Migration: Add work_order_team table for office staff team members
-- This table stores internal team members (office staff) assigned to manage work orders

-- Create work_order_team junction table
CREATE TABLE IF NOT EXISTS work_order_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_order_id, user_profile_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_work_order_team_work_order_id ON work_order_team(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_team_user_profile_id ON work_order_team(user_profile_id);

-- Enable Row Level Security
ALTER TABLE work_order_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated reads on work_order_team"
ON work_order_team FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated inserts on work_order_team"
ON work_order_team FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated deletes on work_order_team"
ON work_order_team FOR DELETE
TO authenticated
USING (true);
