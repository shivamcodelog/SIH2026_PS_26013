-- ==============================================================================
-- SIH26013 - Database Initialization Script
-- Initializes PostGIS spatial extension and schema foundation
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verification query
SELECT PostGIS_Version();
