import re
from typing import Optional, Tuple, Any, Dict
import geopandas as gpd
import pyproj

# Default common projected CRS for the project (Nagpur / Central India UTM Zone 43N)
DEFAULT_PROJECTED_CRS = "EPSG:32643"
CRS_REVIEW_REQUIRED = "CRS_REVIEW_REQUIRED"


def parse_geojson_crs_metadata(geojson_dict: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    Attempts to extract an EPSG string from the top-level 'crs' field of a GeoJSON document.
    Handles standard OGC URNs like:
      - 'urn:ogc:def:crs:OGC:1.3:CRS84' -> 'EPSG:4326'
      - 'urn:ogc:def:crs:EPSG::4326'     -> 'EPSG:4326'
      - 'EPSG:4326'                      -> 'EPSG:4326'
    """
    if not geojson_dict or not isinstance(geojson_dict, dict):
        return None

    crs_meta = geojson_dict.get("crs")
    if not crs_meta or not isinstance(crs_meta, dict):
        return None

    props = crs_meta.get("properties")
    if not props or not isinstance(props, dict):
        return None

    name = props.get("name", "")
    if not isinstance(name, str) or not name.strip():
        return None

    name_clean = name.strip()

    # OGC CRS84 is WGS84 (EPSG:4326) with [longitude, latitude] coordinate ordering
    if "CRS84" in name_clean or "crs84" in name_clean.lower():
        return "EPSG:4326"

    # Match EPSG:XXXX or EPSG::XXXX
    match = re.search(r"EPSG[:\s]*:?(\d+)", name_clean, re.IGNORECASE)
    if match:
        return f"EPSG:{match.group(1)}"

    # Try resolving through pyproj directly
    try:
        crs_obj = pyproj.CRS.from_user_input(name_clean)
        epsg = crs_obj.to_epsg()
        if epsg:
            return f"EPSG:{epsg}"
        return crs_obj.to_string()
    except Exception:
        return None


def detect_crs(gdf: gpd.GeoDataFrame, raw_geojson: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """
    Detects the Coordinate Reference System of a GeoDataFrame.
    To prevent GeoPandas / GDAL from silently assuming EPSG:4326 when no CRS
    is declared in the source GeoJSON, we inspect the source GeoJSON metadata first.
    If no CRS metadata is declared or it cannot be resolved, returns None.
    """
    if raw_geojson is not None:
        # Require explicit CRS declaration in GeoJSON metadata to prevent silent guessing
        if "crs" not in raw_geojson or raw_geojson.get("crs") is None:
            return None
        return parse_geojson_crs_metadata(raw_geojson)

    if gdf.crs is not None:
        epsg = gdf.crs.to_epsg()
        if epsg:
            return f"EPSG:{epsg}"
        return gdf.crs.to_string()

    return None


def normalize_crs(
    gdf: gpd.GeoDataFrame,
    target_crs: str = DEFAULT_PROJECTED_CRS,
    raw_geojson: Optional[Dict[str, Any]] = None,
) -> Tuple[gpd.GeoDataFrame, str]:
    """
    Detects and normalizes dataset geometry to a common projected metric CRS.
    If the source CRS cannot be determined with certainty, flags as 'CRS_REVIEW_REQUIRED'
    and leaves geometries unmodified (never silently assumes or fabricates CRS).

    Returns:
        (transformed_gdf, crs_identifier_or_flag)
    """
    source_crs = detect_crs(gdf, raw_geojson)

    if source_crs is None:
        return gdf, CRS_REVIEW_REQUIRED

    # Set CRS on GeoDataFrame if GeoPandas didn't pick it up automatically
    if gdf.crs is None:
        try:
            gdf = gdf.set_crs(source_crs)
        except Exception:
            return gdf, CRS_REVIEW_REQUIRED

    # If already in target CRS, return as-is
    try:
        source_epsg = pyproj.CRS.from_user_input(source_crs).to_epsg()
        target_epsg = pyproj.CRS.from_user_input(target_crs).to_epsg()
        if source_epsg and target_epsg and source_epsg == target_epsg:
            return gdf, target_crs
    except Exception:
        pass

    # Reproject to common projected CRS
    try:
        reprojected_gdf = gdf.to_crs(target_crs)
        return reprojected_gdf, target_crs
    except Exception:
        # If transformation fails, flag for human review
        return gdf, CRS_REVIEW_REQUIRED
