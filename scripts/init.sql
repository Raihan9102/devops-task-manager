-- Initialize database for DevOps Task Manager
-- This script runs once when the Postgres container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Create indexes for full-text search (run after Sequelize creates tables)
-- These are handled by the ORM, but you can add additional ones here

-- Seed admin user (password: Admin@12345)
-- Note: This is just a reference, actual seeding should be done via API
COMMENT ON DATABASE devops_db IS 'DevOps Task Manager Database - initialized by Docker';
