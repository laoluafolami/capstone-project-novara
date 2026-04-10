-- Team Task Manager Database Schema
-- PostgreSQL Database Schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tasks;

-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for faster queries
CREATE INDEX idx_tasks_status ON tasks(status);

-- Create index on created_at for sorting
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Insert sample data
INSERT INTO tasks (title, description, priority, status) VALUES
    ('Setup Project Repository', 'Initialize git repository and create project structure', 'high', 'done'),
    ('Design Database Schema', 'Create PostgreSQL database schema for task management', 'high', 'done'),
    ('Implement REST API', 'Build Flask REST API with CRUD operations', 'high', 'in_progress'),
    ('Create Frontend UI', 'Build React frontend with Kanban board', 'medium', 'in_progress'),
    ('Add Authentication', 'Implement user authentication and authorization', 'medium', 'todo'),
    ('Write Documentation', 'Create comprehensive README and API documentation', 'low', 'todo');
