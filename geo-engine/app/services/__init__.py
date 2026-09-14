from app.services.schema import detect_schema_mapping, apply_schema_mapping
from app.services.crs import detect_crs, normalize_crs, CRS_REVIEW_REQUIRED, DEFAULT_PROJECTED_CRS
from app.services.geometry import validate_and_repair_geometry, validate_dataset_geometries
from app.services.ingestion import ingest_geojson, IngestionError
from app.services.matching import (
    compute_spatial_score,
    compute_area_score,
    compute_attribute_score,
    compute_confidence,
    generate_candidate_pairs,
    match_datasets,
)

__all__ = [
    "detect_schema_mapping",
    "apply_schema_mapping",
    "detect_crs",
    "normalize_crs",
    "CRS_REVIEW_REQUIRED",
    "DEFAULT_PROJECTED_CRS",
    "validate_and_repair_geometry",
    "validate_dataset_geometries",
    "ingest_geojson",
    "IngestionError",
    "compute_spatial_score",
    "compute_area_score",
    "compute_attribute_score",
    "compute_confidence",
    "generate_candidate_pairs",
    "match_datasets",
]
