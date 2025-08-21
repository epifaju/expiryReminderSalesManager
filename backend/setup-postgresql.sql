-- PostgreSQL Database Setup Script for Sales Manager
-- Run this script as a PostgreSQL superuser to create the database and user

-- Create database
CREATE DATABASE salesmanager;

-- Create user (optional - you can use existing user)
CREATE USER salesmanager WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE salesmanager TO salesmanager;

-- Connect to the database and grant schema privileges
\c salesmanager;
GRANT ALL ON SCHEMA public TO salesmanager;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO salesmanager;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO salesmanager;

-- Optional: Grant future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO salesmanager;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO salesmanager;
