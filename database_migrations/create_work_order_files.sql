-- Migration: Add multi-file support to work orders
-- Date: December 10, 2024
-- Description: Creates work_order_files table to support multiple files per work order

-- Create work_order_files table
CREATE TABLE IF NOT EXISTS work_order_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups by work order
CREATE INDEX IF NOT EXISTS idx_work_order_files_work_order_id 
ON work_order_files(work_order_id);

-- Remove old single-file columns from work_orders table
ALTER TABLE work_orders DROP COLUMN IF EXISTS file_url;
ALTER TABLE work_orders DROP COLUMN IF EXISTS file_name;

-- Note: Run this migration in your Supabase SQL Editor
-- Make sure to delete existing work orders first as instructed by the user
