-- ==============================================================================
-- SIH26013 - Seed 001: Sample Geospatial Data for Verification & Testing
-- Contains real WGS84 EPSG:4326 geometries for ST_Intersects, ST_Area, and IoU tests
-- ==============================================================================

-- 1. Create a Primary Project Container
INSERT INTO projects (id, name, description)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Dwarka Sector 9 Harmonization Pilot',
    'Demonstration parcel alignment between Revenue Department Cadastral map, Municipal Property Tax records, and Drone Orthophoto survey.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create Source Datasets
INSERT INTO datasets (id, project_id, name, source_type, file_name, file_format, crs, record_count, status)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Revenue Department Cadastral Map',
    'CADASTRAL',
    'dwarka_cadastral_2024.geojson',
    'GeoJSON',
    'EPSG:4326',
    2,
    'NORMALIZED'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Municipal Property Tax Registry',
    'MUNICIPAL',
    'property_tax_registry.shp',
    'Shapefile',
    'EPSG:4326',
    1,
    'NORMALIZED'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Drone Orthophoto Boundary Survey',
    'DRONE',
    'drone_survey_footprints.geojson',
    'GeoJSON',
    'EPSG:4326',
    1,
    'NORMALIZED'
) ON CONFLICT (id) DO NOTHING;

-- 3. Create Spatial Records with real WGS84 geometries
INSERT INTO records (id, dataset_id, source_record_id, parcel_id, owner_name, area, geometry, normalized_attributes)
VALUES
-- Record 1: Cadastral Parcel DL-09-0421 (~14,200 sq m)
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'CAD_PARCEL_101',
    'DL-09-0421',
    'Rameshwar Dayal Sharma',
    14205.50,
    ST_SetSRID(ST_GeomFromText('POLYGON((77.0688 28.5921, 77.0700 28.5921, 77.0700 28.5932, 77.0688 28.5932, 77.0688 28.5921))'), 4326),
    '{"raw_owner": "Rameshwar D. Sharma", "mutation_id": "MUT-2018-994", "land_type": "Residential-Plotted"}'::jsonb
),
-- Record 2: Municipal Tax Record TAX-DWR-884 (Overlaps with Record 1, has slight boundary shift)
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'MUNI_REC_4402',
    'DL-09-0421',
    'Rameshwar Sharma',
    14190.20,
    ST_SetSRID(ST_GeomFromText('POLYGON((77.0690 28.5922, 77.0702 28.5922, 77.0702 28.5934, 77.0690 28.5934, 77.0690 28.5922))'), 4326),
    '{"tax_assessment_year": 2024, "building_type": "G+2 RCC", "ward_number": "48-Dwarka-A"}'::jsonb
),
-- Record 3: Drone Survey Footprint (Interior building footprint inside Record 1)
(
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'DRONE_FT_89',
    'DL-09-0421-BLD',
    'Occupant Unknown',
    6540.80,
    ST_SetSRID(ST_GeomFromText('POLYGON((77.0691 28.5923, 77.0699 28.5923, 77.0699 28.5930, 77.0691 28.5930, 77.0691 28.5923))'), 4326),
    '{"flight_altitude_m": 120, "gsd_cm": 2.5, "capture_date": "2024-03-15"}'::jsonb
),
-- Record 4: Adjacent Non-overlapping Parcel DL-09-0422 (Located eastward)
(
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'CAD_PARCEL_102',
    'DL-09-0422',
    'Virender Sehwag Trust',
    12850.00,
    ST_SetSRID(ST_GeomFromText('POLYGON((77.0750 28.5950, 77.0762 28.5950, 77.0762 28.5960, 77.0750 28.5960, 77.0750 28.5950))'), 4326),
    '{"land_use": "Institutional", "sub_registrar_office": "Kapashera"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 4. Create Pairwise Matches
INSERT INTO matches (id, project_id, source_record_a, source_record_b, spatial_score, area_score, attribute_score, confidence, status)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    0.78,
    0.98,
    0.91,
    86.5,
    'REQUIRES_REVIEW'
) ON CONFLICT (id) DO NOTHING;

-- 5. Create Flagged Conflicts
INSERT INTO conflicts (id, match_id, type, severity, description, resolved)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'BOUNDARY_SHIFT',
    'MEDIUM',
    'Northern cadastral boundary extends 14.2m north of registered municipal property boundary.',
    false
) ON CONFLICT (id) DO NOTHING;

-- 6. Create Review Trail
INSERT INTO reviews (id, match_id, reviewer, decision, comment)
VALUES
(
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Tehsildar P. K. Verma',
    'ACCEPT',
    'Boundary discrepancy is within allowable urban survey tolerance (+/- 15m); municipal tax entry confirmed.'
) ON CONFLICT (id) DO NOTHING;
