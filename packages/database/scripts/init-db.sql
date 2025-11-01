-- Database initialization script for PostgreSQL
-- This script sets up the initial database structure and users

-- Create additional databases for different environments
CREATE DATABASE portfolio_test;
CREATE DATABASE portfolio_staging;

-- Grant permissions to the main user
GRANT ALL PRIVILEGES ON DATABASE portfolio_dev TO portfolio_user;
GRANT ALL PRIVILEGES ON DATABASE portfolio_test TO portfolio_user;
GRANT ALL PRIVILEGES ON DATABASE portfolio_staging TO portfolio_user;

-- Enable extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";