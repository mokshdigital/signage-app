-- Migration: Add work_order_chat_messages table for Team Tab chat
-- This table stores chat messages for work order team communication

-- Create work_order_chat_messages table
CREATE TABLE IF NOT EXISTS work_order_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(message) <= 2000),
    file_references UUID[] DEFAULT '{}',
    edited_at TIMESTAMPTZ NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_work_order_id ON work_order_chat_messages(work_order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON work_order_chat_messages(work_order_id, created_at);

-- Enable Row Level Security
ALTER TABLE work_order_chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a team member
CREATE OR REPLACE FUNCTION is_work_order_team_member(wo_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        -- Check if user is WO owner
        SELECT 1 FROM work_orders WHERE id = wo_id AND owner_id = user_id
        UNION
        -- Check if user is in work_order_team (office staff)
        SELECT 1 FROM work_order_team WHERE work_order_id = wo_id AND user_profile_id = user_id
        UNION
        -- Check if user is an assigned technician
        SELECT 1 FROM work_order_assignments WHERE work_order_id = wo_id AND user_profile_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- SELECT: User must be a team member
CREATE POLICY "Team members can view chat messages"
ON work_order_chat_messages FOR SELECT
TO authenticated
USING (is_work_order_team_member(work_order_id, auth.uid()));

-- INSERT: User must be a team member
CREATE POLICY "Team members can send chat messages"
ON work_order_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    is_work_order_team_member(work_order_id, auth.uid())
    AND user_profile_id = auth.uid()
);

-- UPDATE: Only message author can edit
CREATE POLICY "Message author can edit their messages"
ON work_order_chat_messages FOR UPDATE
TO authenticated
USING (user_profile_id = auth.uid())
WITH CHECK (user_profile_id = auth.uid());

-- DELETE: Only message author can delete (we use soft delete via is_deleted)
CREATE POLICY "Message author can delete their messages"
ON work_order_chat_messages FOR DELETE
TO authenticated
USING (user_profile_id = auth.uid());

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE work_order_chat_messages;
