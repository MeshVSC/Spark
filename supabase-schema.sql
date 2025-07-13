-- Spark Task Management App - Supabase Schema
-- Migration from Convex to Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE recurring_pattern AS ENUM ('daily', 'weekly', 'monthly', 'custom');

-- Areas table
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT FALSE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT FALSE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    scheduled_date TIMESTAMPTZ,
    priority priority_level,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sort_order BIGINT,
    tags TEXT[],
    is_deleted BOOLEAN DEFAULT FALSE,
    duration INTEGER, -- in minutes
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtasks table
CREATE TABLE subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time blocks table
CREATE TABLE time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring tasks table
CREATE TABLE recurring_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern recurring_pattern NOT NULL,
    interval_value INTEGER NOT NULL DEFAULT 1,
    days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
    end_date TIMESTAMPTZ,
    occurrences INTEGER,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    last_generated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to tasks table
ALTER TABLE tasks ADD COLUMN recurring_rule_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_areas_user_id ON areas(user_id);
CREATE INDEX idx_areas_user_archived ON areas(user_id, is_archived);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_user_archived ON projects(user_id, is_archived);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX idx_tasks_user_scheduled ON tasks(user_id, scheduled_date);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_area_id ON tasks(area_id);
CREATE INDEX idx_tasks_user_deleted ON tasks(user_id, is_deleted);

CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_subtasks_user_id ON subtasks(user_id);

CREATE INDEX idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX idx_time_blocks_user_date ON time_blocks(user_id, start_time);
CREATE INDEX idx_time_blocks_task_id ON time_blocks(task_id);

CREATE INDEX idx_recurring_tasks_user_id ON recurring_tasks(user_id);
CREATE INDEX idx_recurring_tasks_user_active ON recurring_tasks(user_id, is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_blocks_updated_at BEFORE UPDATE ON time_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_tasks_updated_at BEFORE UPDATE ON recurring_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view their own areas" ON areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own areas" ON areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own areas" ON areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own areas" ON areas FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subtasks" ON subtasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subtasks" ON subtasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subtasks" ON subtasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subtasks" ON subtasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own time blocks" ON time_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own time blocks" ON time_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time blocks" ON time_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own time blocks" ON time_blocks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recurring tasks" ON recurring_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring tasks" ON recurring_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring tasks" ON recurring_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring tasks" ON recurring_tasks FOR DELETE USING (auth.uid() = user_id);