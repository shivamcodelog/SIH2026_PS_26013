from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from app.models.conflicts import (
    ConflictToleranceConfig,
    ConflictDetectionResponse,
)
from app.models.matching import MatchingConfig
from app.services.ingestion import IngestionError
from app.routes.match import _load_and_normalize_gdf
from app.services.matching import match_datasets
from app.services.conflicts import detect_dataset_conflicts

router = APIRouter(prefix="/conflicts", tags=["Conflicts"])


@router.post(
    "",
    response_model=ConflictDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect discrepancies and conflicts across two geospatial datasets",
    description=(
        "Upload two GeoJSON files. The engine reprojects both to common projected CRS, runs entity matching, "
        "and identifies ownership conflicts, area discrepancies, boundary mismatches, and bidirectional "
        "missing records, categorizing each by severity (LOW, MEDIUM, HIGH)."
    ),
)
async def detect_conflicts_endpoint(
    file_a: UploadFile = File(..., description="First GeoJSON dataset (e.g. cadastral)"),
    file_b: UploadFile = File(..., description="Second GeoJSON dataset (e.g. municipal)"),
    area_pct_tolerance: float = Query(0.05, ge=0.0, description="Area percentage tolerance (default 5%)"),
    area_abs_tolerance: float = Query(10.0, ge=0.0, description="Area absolute tolerance in m² (default 10 m²)"),
    boundary_iou_threshold: float = Query(0.85, ge=0.0, le=1.0, description="IoU threshold for clean boundary (default 85%)"),
    matching_threshold: float = Query(0.90, ge=0.0, le=1.0, description="Matching confidence threshold (default 90%)"),
):
    tolerance_config = ConflictToleranceConfig(
        area_pct_tolerance=area_pct_tolerance,
        area_abs_tolerance=area_abs_tolerance,
        boundary_iou_clean_threshold=boundary_iou_threshold,
    )

    matching_config = MatchingConfig(
        threshold=matching_threshold,
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

    # Match and detect conflicts
    try:
        match_response = match_datasets(gdf_a, gdf_b, config=matching_config)
        conflict_response = detect_dataset_conflicts(
            gdf_a,
            gdf_b,
            matching_response=match_response,
            config=tolerance_config,
        )
        return conflict_response
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conflict detection error: {str(err)}",
        )
