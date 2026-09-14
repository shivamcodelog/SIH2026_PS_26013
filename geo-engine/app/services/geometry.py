from typing import Tuple, Dict, List, Optional, Any
import geopandas as gpd
import shapely
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union

SUPPORTED_GEOMETRY_TYPES = {"Polygon", "MultiPolygon"}


def validate_and_repair_geometry(geom: Optional[BaseGeometry]) -> Tuple[Optional[BaseGeometry], str]:
    """
    Validates a single geometry and attempts safe repair if invalid.

    Status categories:
      - 'valid': Geometry was already non-empty, supported type, and topologically valid.
      - 'repaired': Geometry was invalid, but safely repaired into a valid Polygon/MultiPolygon.
      - 'invalid': Geometry is missing, empty, unsupported type, or repair failed.

    Returns:
        (resulting_geometry, status_str)
    """
    if geom is None:
        return None, "invalid"

    try:
        if geom.is_empty:
            return geom, "invalid"

        if geom.geom_type not in SUPPORTED_GEOMETRY_TYPES:
            return geom, "invalid"

        if geom.is_valid:
            return geom, "valid"

        # Attempt safe repair using Shapely 2.x make_valid
        repaired = shapely.make_valid(geom)

        if repaired.is_valid and not repaired.is_empty:
            if repaired.geom_type in SUPPORTED_GEOMETRY_TYPES:
                return repaired, "repaired"

            if repaired.geom_type == "GeometryCollection":
                # Extract only polygonal components from collection
                polys = [g for g in repaired.geoms if g.geom_type in SUPPORTED_GEOMETRY_TYPES]
                if polys:
                    unified = unary_union(polys)
                    if unified.is_valid and not unified.is_empty and unified.geom_type in SUPPORTED_GEOMETRY_TYPES:
                        return unified, "repaired"

        # Repair did not yield a valid Polygon/MultiPolygon
        return geom, "invalid"

    except Exception:
        return geom, "invalid"


def validate_dataset_geometries(
    gdf: gpd.GeoDataFrame,
) -> Tuple[gpd.GeoDataFrame, Dict[str, int], List[str]]:
    """
    Validates and repairs geometries across all records in a GeoDataFrame.
    Tracks repair status per record additively in '_validation_status' column.

    Returns:
        (updated_gdf, validation_summary_dict, unique_geometry_types)
    """
    if gdf.empty:
        return gdf, {"valid": 0, "repaired": 0, "invalid": 0}, []

    valid_count = 0
    repaired_count = 0
    invalid_count = 0

    repaired_geometries = []
    statuses = []

    for geom in gdf.geometry:
        new_geom, status = validate_and_repair_geometry(geom)
        repaired_geometries.append(new_geom)
        statuses.append(status)

        if status == "valid":
            valid_count += 1
        elif status == "repaired":
            repaired_count += 1
        else:
            invalid_count += 1

    # Create a clean updated GeoDataFrame
    updated_gdf = gdf.copy()
    updated_gdf.geometry = repaired_geometries
    updated_gdf["_validation_status"] = statuses

    # Determine unique geometry types among valid and repaired records
    geom_types_set = set()
    for g in repaired_geometries:
        if g is not None and not g.is_empty:
            geom_types_set.add(g.geom_type)

    unique_geom_types = sorted(list(geom_types_set)) if geom_types_set else ["None"]

    summary = {
        "valid": valid_count,
        "repaired": repaired_count,
        "invalid": invalid_count,
    }

    return updated_gdf, summary, unique_geom_types
