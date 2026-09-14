from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from app.models.ingest import IngestionResponse
from app.services.ingestion import ingest_geojson, IngestionError
from app.services.crs import DEFAULT_PROJECTED_CRS

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post(
    "",
    response_model=IngestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest, validate, and normalize a GeoJSON land record dataset",
    description=(
        "Upload a GeoJSON file. The engine validates structure, detects and maps schema aliases, "
        "detects and normalizes CRS to common projected metric CRS (or flags CRS_REVIEW_REQUIRED), "
        "and validates/repairs geometries."
    ),
)
async def ingest_dataset(
    file: UploadFile = File(..., description="GeoJSON file to ingest (.geojson or .json)"),
    target_crs: str = Query(
        DEFAULT_PROJECTED_CRS,
        description="Target projected CRS to normalize coordinates into. Defaults to EPSG:32643 (UTM Zone 43N).",
    ),
):
    # Validate filename and extension
    filename = file.filename or "uploaded.geojson"
    lower_filename = filename.lower()
    if not (lower_filename.endswith(".geojson") or lower_filename.endswith(".json")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format for '{filename}'. Only .geojson and .json files are supported.",
        )

    # Read file content safely
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    # Check file size
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    # Execute ingestion service
    try:
        result = ingest_geojson(
            file_bytes=content,
            filename=filename,
            target_crs=target_crs,
        )
        return result
    except IngestionError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal ingestion error: {str(err)}",
        )
