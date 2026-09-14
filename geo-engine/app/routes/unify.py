"""
FastAPI route for Mission 7 — /unify

Accepts two GeoJSON datasets (cadastral + municipal), runs the full pipeline
inline (ingest → match → conflict detection → unified record generation),
and returns the §13 unified record response.

The route is intentionally self-contained so callers get a single round-trip
result without having to chain /match → /conflicts → /unify manually.
"""

import io

import geopandas as gpd
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app.models.conflicts import ConflictToleranceConfig
from app.models.matching import MatchingConfig, MatchingWeights
from app.models.unified import (
    UnifiedRecordGenerationConfig,
    UnifiedRecordGenerationResponse,
)
from app.services.crs import CRS_REVIEW_REQUIRED, DEFAULT_PROJECTED_CRS, normalize_crs
from app.services.ingestion import IngestionError, validate_geojson_structure
from app.services.matching import match_datasets
from app.services.conflicts import detect_dataset_conflicts
from app.services.unified import generate_unified_records

router = APIRouter(prefix="/unify", tags=["Unified Records"])


def _load_and_normalize_gdf(
    file_bytes: bytes,
    filename: str,
    target_crs: str = DEFAULT_PROJECTED_CRS,
) -> gpd.GeoDataFrame:
    """Validate, load, and reproject a GeoJSON upload to the common metric CRS."""
    geojson_dict = validate_geojson_structure(file_bytes)
    try:
        gdf = gpd.read_file(io.BytesIO(file_bytes))
    except Exception as e:
        raise IngestionError(f"Could not parse features in '{filename}': {e}", status_code=400)

    if gdf.empty:
        raise IngestionError(f"Dataset '{filename}' contains 0 records.", status_code=400)

    norm_gdf, crs_str = normalize_crs(gdf, target_crs=target_crs, raw_geojson=geojson_dict)
    if crs_str == CRS_REVIEW_REQUIRED:
        raise IngestionError(
            f"Dataset '{filename}' has an unresolvable CRS. "
            "CRS must be confirmed before unification can proceed.",
            status_code=422,
        )

    return norm_gdf


@router.post(
    "",
    response_model=UnifiedRecordGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate unified records from cadastral and municipal datasets",
    description=(
        "Uploads two GeoJSON files, runs spatial matching and conflict detection inline, "
        "and produces the §13 unified record shape for every matched and unmatched parcel. "
        "Each record is fully traceable to its source records with documented geometry selection rules."
    ),
)
async def unify_datasets(
    cadastral: UploadFile = File(..., description="Cadastral GeoJSON (primary / source A)"),
    municipal: UploadFile = File(..., description="Municipal GeoJSON (secondary / source B)"),
    # Matching configuration
    threshold: float = Query(0.90, ge=0.0, le=1.0, description="Confidence threshold for AUTO_VERIFIED"),
    spatial_weight: float = Query(0.50, ge=0.0, le=1.0, description="Weight for spatial IoU overlap"),
    area_weight: float = Query(0.20, ge=0.0, le=1.0, description="Weight for area similarity"),
    attribute_weight: float = Query(0.30, ge=0.0, le=1.0, description="Weight for fuzzy attribute similarity"),
    min_spatial_score: float = Query(0.15, ge=0.0, le=1.0, description="Minimum spatial IoU cutoff"),
    candidate_buffer_m: float = Query(15.0, ge=0.0, description="Candidate search buffer in metres"),
    # Unified record configuration
    geometry_iou_prefer_cadastral: float = Query(
        0.85,
        ge=0.0,
        le=1.0,
        description=(
            "IoU threshold above which cadastral geometry is preferred as canonical. "
            "Below this, the record is flagged REQUIRES_REVIEW."
        ),
    ),
):
    # --- Read uploads ---
    try:
        content_cad = await cadastral.read()
        content_mun = await municipal.read()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File read error: {e}")

    # --- Load and normalise ---
    try:
        gdf_a = _load_and_normalize_gdf(content_cad, cadastral.filename or "cadastral.geojson")
        gdf_b = _load_and_normalize_gdf(content_mun, municipal.filename or "municipal.geojson")
    except IngestionError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message)
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err))

    # --- Match ---
    matching_config = MatchingConfig(
        weights=MatchingWeights(spatial=spatial_weight, area=area_weight, attribute=attribute_weight),
        threshold=threshold,
        min_spatial_score=min_spatial_score,
        candidate_buffer_m=candidate_buffer_m,
    )
    try:
        matching_result = match_datasets(gdf_a, gdf_b, config=matching_config)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Matching engine error: {err}",
        )

    # --- Conflict detection ---
    try:
        conflict_result = detect_dataset_conflicts(
            gdf_a, gdf_b, matching_result, config=ConflictToleranceConfig()
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conflict detection error: {err}",
        )

    # --- Unified record generation ---
    unified_config = UnifiedRecordGenerationConfig(
        geometry_iou_prefer_cadastral=geometry_iou_prefer_cadastral,
        confidence_threshold=threshold,
    )
    try:
        result = generate_unified_records(
            gdf_a=gdf_a,
            gdf_b=gdf_b,
            matching_response=matching_result,
            conflict_response=conflict_result,
            config=unified_config,
        )
        return result
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unified record generation error: {err}",
        )
