-- ==============================================================================
-- SIH26013 - Database Initialization Script
-- Auto-executed on PostgreSQL container startup via docker-entrypoint-initdb.d
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Execute Base Schema Migration
\i /docker-entrypoint-initdb.d/migrations/001_initial_schema.sql

-- 3. Execute Verification Seed Data
\i /docker-entrypoint-initdb.d/seeds/001_sample_data.sql

-- 4. Spatial Verification Log
SELECT PostGIS_Full_Version();
