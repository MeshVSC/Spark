-- Add missing fields to projects table
-- Run this in Supabase SQL Editor

-- Add due_date column
ALTER TABLE projects ADD COLUMN due_date TIMESTAMPTZ;

-- Add priority column (using existing priority_level enum)
ALTER TABLE projects ADD COLUMN priority priority_level;

-- Add area_id column (foreign key to areas table)
ALTER TABLE projects ADD COLUMN area_id UUID REFERENCES areas(id) ON DELETE SET NULL;

-- Add tags column (text array like tasks table)
ALTER TABLE projects ADD COLUMN tags TEXT[];

-- Create indexes for the new columns
CREATE INDEX idx_projects_due_date ON projects(user_id, due_date);
CREATE INDEX idx_projects_area_id ON projects(area_id);
CREATE INDEX idx_projects_priority ON projects(user_id, priority);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;