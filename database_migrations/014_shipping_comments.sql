-- Migration: Create work_order_shipping_comments table
-- Date: 2024-12-19
-- Description: Adds threaded comments for tracking shipping conversations

-- Create shipping comments table
CREATE TABLE IF NOT EXISTS work_order_shipping_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_shipping_comments_work_order_id 
ON work_order_shipping_comments(work_order_id);

CREATE INDEX IF NOT EXISTS idx_shipping_comments_user_id 
ON work_order_shipping_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_shipping_comments_created_at 
ON work_order_shipping_comments(created_at DESC);

-- Enable RLS
ALTER TABLE work_order_shipping_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all reads on shipping_comments"
    ON work_order_shipping_comments FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow authenticated inserts on shipping_comments"
    ON work_order_shipping_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update own shipping_comments"
    ON work_order_shipping_comments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete own shipping_comments"
    ON work_order_shipping_comments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
