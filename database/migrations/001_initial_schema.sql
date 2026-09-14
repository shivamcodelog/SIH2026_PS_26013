-- ==============================================================================
-- SIH26013 - Migration 001: Initial PostGIS Spatial Schema
-- Compliant with: docs/PROJECT_CONTEXT.md (§6 Data model) & rules/project-rules.md
-- ==============================================================================

-- 1. Enable Required Spatial & Utility Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if rebuilding (clean reproducibility)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS conflicts CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS records CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ------------------------------------------------------------------------------
-- Table 1: projects
-- Top-level container for multi-source land record harmonization sessions
-- ------------------------------------------------------------------------------
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Table 2: datasets
-- Represents raw intake files (Cadastral GeoJSON, Municipal Shapefile, Drone survey)
-- ------------------------------------------------------------------------------
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('CADASTRAL', 'MUNICIPAL', 'DRONE')),
    file_name TEXT,
    file_format TEXT,
    crs TEXT NOT NULL DEFAULT 'EPSG:4326',
    record_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PARSED', 'NORMALIZED', 'ERROR')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Table 3: records
-- Normalized spatial records maintaining strict non-destructive source traceability
-- ------------------------------------------------------------------------------
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    source_record_id TEXT,
    parcel_id TEXT,
    owner_name TEXT,
    area DOUBLE PRECISION,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    normalized_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Table 4: matches
-- Pairwise record matches evaluated across spatial overlap, area, and attributes
-- ------------------------------------------------------------------------------
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_record_a UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    source_record_b UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    spatial_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    area_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    attribute_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    confidence DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('AUTO_VERIFIED', 'REQUIRES_REVIEW', 'HUMAN_VERIFIED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_different_records CHECK (source_record_a <> source_record_b)
);

-- ------------------------------------------------------------------------------
-- Table 5: conflicts
-- Explicit discrepancies flagged during matching (owner mismatch, boundary shift, etc.)
-- ------------------------------------------------------------------------------
CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('OWNER_MISMATCH', 'AREA_DISCREPANCY', 'BOUNDARY_SHIFT', 'MISSING_RECORD')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    description TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Table 6: reviews
-- Official review actions and audit trail by human land records authority
-- ------------------------------------------------------------------------------
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    reviewer TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('ACCEPT', 'REJECT', 'RESOLVE')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================

-- Spatial GiST Index on geometry column (Critical for fast ST_Intersects, ST_Contains)
CREATE INDEX idx_records_geometry ON records USING GIST (geometry);

-- Foreign Key B-Tree Indexes
CREATE INDEX idx_datasets_project_id ON datasets(project_id);
CREATE INDEX idx_records_dataset_id ON records(dataset_id);
CREATE INDEX idx_matches_project_id ON matches(project_id);
CREATE INDEX idx_matches_source_record_a ON matches(source_record_a);
CREATE INDEX idx_matches_source_record_b ON matches(source_record_b);
CREATE INDEX idx_conflicts_match_id ON conflicts(match_id);
CREATE INDEX idx_reviews_match_id ON reviews(match_id);

-- Filter & Status Indexes (Optimizes dashboard & review queue queries)
CREATE INDEX idx_matches_confidence ON matches(confidence);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_conflicts_resolved ON conflicts(resolved);
CREATE INDEX idx_conflicts_type ON conflicts(type);
CREATE INDEX idx_records_parcel_id ON records(parcel_id);

-- JSONB GIN Index for deep attribute lookups without table scans
CREATE INDEX idx_records_attributes_gin ON records USING GIN (normalized_attributes);
