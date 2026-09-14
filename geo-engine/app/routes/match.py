import io
import json
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
import geopandas as gpd

from app.models.matching import (
    MatchingConfig,
    MatchingWeights,
    MatchingResponse,
)
from app.services.ingestion import validate_geojson_structure, IngestionError
from app.services.crs import normalize_crs, CRS_REVIEW_REQUIRED, DEFAULT_PROJECTED_CRS
from app.services.matching import match_datasets

router = APIRouter(prefix="/match", tags=["Matching"])


def _load_and_normalize_gdf(file_bytes: bytes, filename: str, target_crs: str = DEFAULT_PROJECTED_CRS) -> gpd.GeoDataFrame:
    """Helper to validate, load, and project GeoJSON bytes into a common metric CRS."""
    geojson_dict = validate_geojson_structure(file_bytes)
    try:
        gdf = gpd.read_file(io.BytesIO(file_bytes))
    except Exception as e:
        raise IngestionError(f"Could not parse features in '{filename}': {str(e)}", status_code=400)

    if gdf.empty:
        raise IngestionError(f"Dataset '{filename}' contains 0 records.", status_code=400)

    norm_gdf, crs_str = normalize_crs(gdf, target_crs=target_crs, raw_geojson=geojson_dict)
    if crs_str == CRS_REVIEW_REQUIRED:
        raise IngestionError(
            f"Dataset '{filename}' has an unresolvable or undeclared Coordinate Reference System (CRS). "
            "CRS must be reviewed before spatial matching can be computed.",
            status_code=422,
        )

    return norm_gdf


@router.post(
    "",
    response_model=MatchingResponse,
    status_code=status.HTTP_200_OK,
    summary="Match entities across two geospatial datasets",
    description=(
        "Upload two GeoJSON files (e.g. Cadastral and Municipal). The engine reprojects both to a common "
        "metric CRS, generates candidates via spatial indexing (STRtree), computes explainable component scores "
        "(spatial IoU, area ratio, fuzzy attribute), and assigns verification status based on confidence threshold."
    ),
)
async def match_two_datasets(
    file_a: UploadFile = File(..., description="First GeoJSON dataset (e.g. cadastral)"),
    file_b: UploadFile = File(..., description="Second GeoJSON dataset (e.g. municipal or buildings)"),
    threshold: float = Query(0.90, ge=0.0, le=1.0, description="Confidence threshold for AUTO_VERIFIED status"),
    spatial_weight: float = Query(0.50, ge=0.0, le=1.0, description="Weight for spatial IoU overlap"),
    area_weight: float = Query(0.20, ge=0.0, le=1.0, description="Weight for area similarity"),
    attribute_weight: float = Query(0.30, ge=0.0, le=1.0, description="Weight for fuzzy attribute similarity"),
    min_spatial_score: float = Query(0.15, ge=0.0, le=1.0, description="Minimum spatial IoU cutoff for candidates"),
    candidate_buffer_m: float = Query(15.0, ge=0.0, description="Candidate search buffer in meters"),
):
    # Normalize weights if sum is close to 1.0 or user provided custom weights
    weights = MatchingWeights(
        spatial=spatial_weight,
        area=area_weight,
        attribute=attribute_weight,
    )

    config = MatchingConfig(
        weights=weights,
        threshold=threshold,
        min_spatial_score=min_spatial_score,
        candidate_buffer_m=candidate_buffer_m,
    )

    # Read file contents
    try:
        content_a = await file_a.read()
        content_b = await file_b.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded files: {str(e)}",
        )

    # Load and normalize both datasets
    try:
        gdf_a = _load_and_normalize_gdf(content_a, file_a.filename or "dataset_a.geojson")
        gdf_b = _load_and_normalize_gdf(content_b, file_b.filename or "dataset_b.geojson")
    except IngestionError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message)
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err))

    # Execute matching
    try:
        result = match_datasets(gdf_a, gdf_b, config=config)
        return result
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spatial matching engine error: {str(err)}",
        )
