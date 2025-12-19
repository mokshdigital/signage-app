-- =============================================
-- Migration: Task Categories and Tags
-- Description: Add work order categories (scoped to WO) and global task tags
-- =============================================

-- =============================================
-- 1. WORK ORDER CATEGORIES (WO-scoped)
-- =============================================
CREATE TABLE IF NOT EXISTS work_order_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6', -- Default blue
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate category names within the same work order
    UNIQUE(work_order_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wo_categories_work_order_id ON work_order_categories(work_order_id);

-- RLS
ALTER TABLE work_order_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on work_order_categories"
    ON work_order_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated inserts on work_order_categories"
    ON work_order_categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated updates on work_order_categories"
    ON work_order_categories FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated deletes on work_order_categories"
    ON work_order_categories FOR DELETE
    TO authenticated
    USING (true);

-- =============================================
-- 2. TASK TAGS (Global)
-- =============================================
CREATE TABLE IF NOT EXISTS task_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#10B981', -- Default green
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on task_tags"
    ON task_tags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated inserts on task_tags"
    ON task_tags FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated updates on task_tags"
    ON task_tags FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated deletes on task_tags"
    ON task_tags FOR DELETE
    TO authenticated
    USING (true);

-- =============================================
-- 3. TASK TAG ASSIGNMENTS (Junction table)
-- =============================================
CREATE TABLE IF NOT EXISTS task_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES work_order_tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate tag assignments per task
    UNIQUE(task_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_tag_assignments_task_id ON task_tag_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tag_assignments_tag_id ON task_tag_assignments(tag_id);

-- RLS
ALTER TABLE task_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on task_tag_assignments"
    ON task_tag_assignments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated inserts on task_tag_assignments"
    ON task_tag_assignments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated deletes on task_tag_assignments"
    ON task_tag_assignments FOR DELETE
    TO authenticated
    USING (true);

-- =============================================
-- 4. ADD CATEGORY_ID TO WORK_ORDER_TASKS
-- =============================================
ALTER TABLE work_order_tasks 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES work_order_categories(id) ON DELETE SET NULL;

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_work_order_tasks_category_id ON work_order_tasks(category_id);

-- =============================================
-- Sample color palette for reference:
-- Blue: #3B82F6
-- Green: #10B981
-- Red: #EF4444
-- Yellow: #F59E0B
-- Purple: #8B5CF6
-- Pink: #EC4899
-- Indigo: #6366F1
-- Teal: #14B8A6
-- Orange: #F97316
-- Gray: #6B7280
-- =============================================
