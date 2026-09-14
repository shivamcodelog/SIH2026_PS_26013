import io
import json
from typing import Dict, Any, Optional
import geopandas as gpd

from app.services.schema import detect_schema_mapping
from app.services.crs import normalize_crs, DEFAULT_PROJECTED_CRS
from app.services.geometry import validate_dataset_geometries


class IngestionError(Exception):
    """Custom exception raised when file or GeoJSON validation fails."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_geojson_structure(raw_data: bytes) -> Dict[str, Any]:
    """
    Validates that the raw file bytes represent valid JSON and adhere to the
    GeoJSON FeatureCollection specification with non-empty features.
    """
    if not raw_data or len(raw_data.strip()) == 0:
        raise IngestionError("Uploaded file is empty.", status_code=400)

    try:
        data = json.loads(raw_data.decode("utf-8"))
    except UnicodeDecodeError:
        raise IngestionError("File must be UTF-8 encoded text.", status_code=400)
    except json.JSONDecodeError as e:
        raise IngestionError(f"Invalid JSON format: {str(e)}", status_code=400)

    if not isinstance(data, dict):
        raise IngestionError("Invalid GeoJSON: Root must be a JSON object.", status_code=400)

    geojson_type = data.get("type")
    if geojson_type != "FeatureCollection":
        if geojson_type == "Feature":
            # Wrap single feature into a FeatureCollection
            data = {"type": "FeatureCollection", "features": [data]}
        else:
            raise IngestionError(
                f"Unsupported or missing GeoJSON type '{geojson_type}'. Must be 'FeatureCollection'.",
                status_code=400,
            )

    features = data.get("features")
    if not isinstance(features, list):
        raise IngestionError("Invalid GeoJSON: 'features' must be an array.", status_code=400)

    if len(features) == 0:
        raise IngestionError("GeoJSON FeatureCollection contains 0 features.", status_code=400)

    return data


def ingest_geojson(
    file_bytes: bytes,
    filename: str = "upload.geojson",
    target_crs: str = DEFAULT_PROJECTED_CRS,
) -> Dict[str, Any]:
    """
    Executes the complete ingestion pipeline:
      1. Validates file existence and GeoJSON structure.
      2. Loads into GeoDataFrame via GeoPandas.
      3. Detects schema alias mappings (source field -> canonical field).
      4. Detects and normalizes CRS to target projected metric CRS (or flags 'CRS_REVIEW_REQUIRED').
      5. Validates and safely repairs geometries per record.
      6. Formats and returns the structured response matching Mission 4 contract.

    Returns:
      {
        "success": True,
        "records_processed": int,
        "crs": str,
        "geometry_types": list[str],
        "schema_mapping": dict[str, str],
        "validation": { "valid": int, "repaired": int, "invalid": int }
      }
    """
    # Step 1: Validate GeoJSON structure
    geojson_dict = validate_geojson_structure(file_bytes)

    # Step 2: Load into GeoDataFrame
    try:
        gdf = gpd.read_file(io.BytesIO(file_bytes))
    except Exception as e:
        raise IngestionError(f"Failed to read GeoJSON features into spatial dataframe: {str(e)}", status_code=400)

    if gdf.empty:
        raise IngestionError("Dataset contains no valid records.", status_code=400)

    # Step 3: Schema detection
    # Inspect non-geometry property columns
    property_cols = [c for c in gdf.columns if c.lower() not in {"geometry", "type"}]
    schema_mapping = detect_schema_mapping(property_cols)

    # Step 4: CRS detection and normalization
    gdf, crs_str = normalize_crs(gdf, target_crs=target_crs, raw_geojson=geojson_dict)

    # Step 5: Geometry validation and repair
    gdf, validation_summary, geometry_types = validate_dataset_geometries(gdf)

    # Step 6: Construct structured response contract
    return {
        "success": True,
        "records_processed": len(gdf),
        "crs": crs_str,
        "geometry_types": geometry_types,
        "schema_mapping": schema_mapping,
        "validation": validation_summary,
    }
