-- Migration: Create task comments system
-- Date: 2024-12-19
-- Description: Adds threaded comments with attachments and @mentions for work order tasks

-- =============================================
-- TABLE: work_order_task_comments
-- =============================================
CREATE TABLE IF NOT EXISTS work_order_task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES work_order_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id 
ON work_order_task_comments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_user_id 
ON work_order_task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_created_at 
ON work_order_task_comments(created_at DESC);

-- =============================================
-- TABLE: task_comment_mentions
-- Junction table for @mentions (for future notifications)
-- =============================================
CREATE TABLE IF NOT EXISTS task_comment_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES work_order_task_comments(id) ON DELETE CASCADE,
    -- One of these will be set per row (not both)
    mentioned_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    mentioned_technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure at least one mention target is set
    CONSTRAINT chk_mention_target CHECK (
        (mentioned_user_id IS NOT NULL AND mentioned_technician_id IS NULL) OR
        (mentioned_user_id IS NULL AND mentioned_technician_id IS NOT NULL)
    )
);

-- Indexes for mention lookups
CREATE INDEX IF NOT EXISTS idx_task_comment_mentions_comment_id 
ON task_comment_mentions(comment_id);

CREATE INDEX IF NOT EXISTS idx_task_comment_mentions_user_id 
ON task_comment_mentions(mentioned_user_id);

CREATE INDEX IF NOT EXISTS idx_task_comment_mentions_technician_id 
ON task_comment_mentions(mentioned_technician_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on comments table
ALTER TABLE work_order_task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
DROP POLICY IF EXISTS "Allow all reads on task_comments" ON work_order_task_comments;
CREATE POLICY "Allow all reads on task_comments"
    ON work_order_task_comments FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated inserts on task_comments" ON work_order_task_comments;
CREATE POLICY "Allow authenticated inserts on task_comments"
    ON work_order_task_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to update own task_comments" ON work_order_task_comments;
CREATE POLICY "Allow users to update own task_comments"
    ON work_order_task_comments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow users to delete own task_comments" ON work_order_task_comments;
CREATE POLICY "Allow users to delete own task_comments"
    ON work_order_task_comments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Enable RLS on mentions table
ALTER TABLE task_comment_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentions (follow parent comment)
DROP POLICY IF EXISTS "Allow all reads on task_comment_mentions" ON task_comment_mentions;
CREATE POLICY "Allow all reads on task_comment_mentions"
    ON task_comment_mentions FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated inserts on task_comment_mentions" ON task_comment_mentions;
CREATE POLICY "Allow authenticated inserts on task_comment_mentions"
    ON task_comment_mentions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Mentions are deleted via CASCADE from parent comment, no direct delete policy needed
