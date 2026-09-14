from typing import Optional, List, Dict, Any, Set
import geopandas as gpd
from shapely.geometry.base import BaseGeometry

from app.models.conflicts import (
    ConflictSeverity,
    ConflictType,
    ConflictItem,
    ConflictToleranceConfig,
    EntityConflicts,
    ConflictDetectionResponse,
)
from app.models.matching import MatchRecord, MatchingResponse
from app.services.matching import compute_attribute_score, _get_entity_id, _get_entity_name, _get_entity_area


def detect_owner_conflict(
    name_a: Optional[str],
    name_b: Optional[str],
    attribute_score: float,
    config: ConflictToleranceConfig,
) -> Optional[ConflictItem]:
    """
    Detects ownership discrepancies between two records.
    Distinguishes acceptable name-format variance (e.g. 'Priya Sharma' vs 'P. Sharma')
    from true ownership conflicts (e.g. 'Ravi Kumar' vs 'Amit Singh').
    """
    str_a = str(name_a).strip() if name_a else None
    str_b = str(name_b).strip() if name_b else None

    # Missing name in one source
    if (str_a and not str_b) or (str_b and not str_a):
        present_name = str_a or str_b
        return ConflictItem(
            type=ConflictType.OWNER_MISMATCH.value,
            severity=ConflictSeverity.LOW.value,
            description=f"Owner name is specified in one source ('{present_name}') but missing in the other.",
            details={"owner_name_a": str_a, "owner_name_b": str_b, "attribute_score": attribute_score},
        )

    if not str_a and not str_b:
        return None

    # Exact match
    if str_a.lower() == str_b.lower():
        return None

    # Format variance: score >= 0.85 (e.g. abbreviations, initial format) is acceptable variance
    if attribute_score >= 0.85:
        return None

    # High severity: genuinely different name (score < 0.60)
    if attribute_score < config.owner_high_severity_score_threshold:
        return ConflictItem(
            type=ConflictType.OWNER_MISMATCH.value,
            severity=ConflictSeverity.HIGH.value,
            description=f"Ownership conflict: Cadastral reports '{str_a}', Municipal reports '{str_b}' (name similarity: {attribute_score:.1%}).",
            details={
                "owner_name_a": str_a,
                "owner_name_b": str_b,
                "attribute_score": attribute_score,
                "conflict_category": "GENUINE_NAME_MISMATCH",
            },
        )

    # Moderate divergence (e.g. significant typo or compound name mismatch)
    return ConflictItem(
        type=ConflictType.OWNER_MISMATCH.value,
        severity=ConflictSeverity.MEDIUM.value,
        description=f"Owner name variance: Cadastral reports '{str_a}', Municipal reports '{str_b}' (name similarity: {attribute_score:.1%}).",
        details={
            "owner_name_a": str_a,
            "owner_name_b": str_b,
            "attribute_score": attribute_score,
            "conflict_category": "MODERATE_NAME_VARIANCE",
        },
    )


def detect_area_conflict(
    area_a: Optional[float],
    area_b: Optional[float],
    config: ConflictToleranceConfig,
) -> Optional[ConflictItem]:
    """
    Detects area discrepancies based on absolute and percentage tolerance thresholds.
    """
    if area_a is None or area_b is None or area_a <= 0 or area_b <= 0:
        return None

    diff_abs = abs(area_a - area_b)
    max_area = max(area_a, area_b)
    diff_pct = diff_abs / max_area if max_area > 0 else 0.0

    # Ensure high thresholds are at least as large as base tolerances
    high_pct = max(config.area_high_pct_tolerance, config.area_pct_tolerance)
    high_abs = max(config.area_high_abs_tolerance, config.area_abs_tolerance)

    # High severity: exceeds high percentage and/or absolute threshold
    if diff_pct > high_pct or diff_abs > high_abs:
        return ConflictItem(
            type=ConflictType.AREA_MISMATCH.value,
            severity=ConflictSeverity.HIGH.value,
            description=f"Significant area discrepancy: Cadastral reports {area_a:.1f} m², Municipal reports {area_b:.1f} m² (difference: {diff_abs:.1f} m², {diff_pct:.1%}).",
            details={
                "area_a": area_a,
                "area_b": area_b,
                "difference_sqm": round(diff_abs, 2),
                "difference_percent": round(diff_pct * 100, 2),
            },
        )

    # Medium severity: > 5% or > 10 m²
    if diff_pct > config.area_pct_tolerance or diff_abs > config.area_abs_tolerance:
        return ConflictItem(
            type=ConflictType.AREA_MISMATCH.value,
            severity=ConflictSeverity.MEDIUM.value,
            description=f"Moderate area discrepancy: Cadastral reports {area_a:.1f} m², Municipal reports {area_b:.1f} m² (difference: {diff_abs:.1f} m², {diff_pct:.1%}).",
            details={
                "area_a": area_a,
                "area_b": area_b,
                "difference_sqm": round(diff_abs, 2),
                "difference_percent": round(diff_pct * 100, 2),
            },
        )

    return None


def detect_boundary_conflict(
    geom_a: Optional[BaseGeometry],
    geom_b: Optional[BaseGeometry],
    spatial_score: float,
    config: ConflictToleranceConfig,
) -> Optional[ConflictItem]:
    """
    Detects boundary geometry differences using spatial IoU overlap and symmetric difference area.
    """
    if geom_a is None or geom_b is None or geom_a.is_empty or geom_b.is_empty:
        return None

    # Zero overlap is handled via missing/unmatched records
    if spatial_score <= 0.0:
        return None

    # IoU >= 0.85 is considered clean boundary alignment
    if spatial_score >= config.boundary_iou_clean_threshold:
        return None

    try:
        sym_diff_area = geom_a.symmetric_difference(geom_b).area
    except Exception:
        sym_diff_area = 0.0

    # Severe mismatch: IoU < 0.65
    if spatial_score < config.boundary_iou_high_severity_threshold:
        return ConflictItem(
            type=ConflictType.BOUNDARY_MISMATCH.value,
            severity=ConflictSeverity.HIGH.value,
            description=f"Severe boundary mismatch: Spatial overlap IoU is {spatial_score:.1%} (symmetric boundary difference: {sym_diff_area:.1f} m²).",
            details={
                "spatial_iou": spatial_score,
                "symmetric_difference_sqm": round(sym_diff_area, 2),
            },
        )

    # Moderate mismatch: 0.65 <= IoU < 0.85
    return ConflictItem(
        type=ConflictType.BOUNDARY_MISMATCH.value,
        severity=ConflictSeverity.MEDIUM.value,
        description=f"Moderate boundary misalignment: Spatial overlap IoU is {spatial_score:.1%} (symmetric boundary difference: {sym_diff_area:.1f} m²).",
        details={
            "spatial_iou": spatial_score,
            "symmetric_difference_sqm": round(sym_diff_area, 2),
        },
    )


def detect_missing_record_conflict(
    entity_id: str,
    direction: str = "missing_in_municipal",
) -> ConflictItem:
    """
    Generates a missing-record conflict item when an entity exists in one dataset
    but has no counterpart in the other.
    """
    if direction == "missing_in_municipal":
        return ConflictItem(
            type=ConflictType.MISSING_MUNICIPAL_RECORD.value,
            severity=ConflictSeverity.HIGH.value,
            description=f"Cadastral parcel {entity_id} exists in cadastral survey but has no corresponding municipal property tax record.",
            details={"entity_id": entity_id, "direction": direction},
        )
    else:
        return ConflictItem(
            type=ConflictType.MISSING_CADASTRAL_RECORD.value,
            severity=ConflictSeverity.HIGH.value,
            description=f"Municipal property {entity_id} exists in municipal records but has no corresponding cadastral parcel.",
            details={"entity_id": entity_id, "direction": direction},
        )


def evaluate_match_conflicts(
    match: MatchRecord,
    geom_a: Optional[BaseGeometry],
    geom_b: Optional[BaseGeometry],
    config: Optional[ConflictToleranceConfig] = None,
) -> List[ConflictItem]:
    """
    Evaluates all conflict types for a single match record.
    """
    if config is None:
        config = ConflictToleranceConfig()

    conflicts: List[ConflictItem] = []

    # Handle UNMATCHED entity (missing in B)
    if match.status == "UNMATCHED" or match.source_record_b is None:
        conflicts.append(detect_missing_record_conflict(match.source_record_a, direction="missing_in_municipal"))
        return conflicts

    details = match.details or {}
    name_a = details.get("owner_name_a")
    name_b = details.get("owner_name_b")
    area_a = details.get("area_a")
    area_b = details.get("area_b")

    # 1. Owner conflict
    owner_conflict = detect_owner_conflict(name_a, name_b, match.attribute_score, config)
    if owner_conflict:
        conflicts.append(owner_conflict)

    # 2. Area conflict
    area_conflict = detect_area_conflict(area_a, area_b, config)
    if area_conflict:
        conflicts.append(area_conflict)

    # 3. Boundary conflict
    boundary_conflict = detect_boundary_conflict(geom_a, geom_b, match.spatial_score, config)
    if boundary_conflict:
        conflicts.append(boundary_conflict)

    return conflicts


def detect_dataset_conflicts(
    gdf_a: gpd.GeoDataFrame,
    gdf_b: gpd.GeoDataFrame,
    matching_response: MatchingResponse,
    config: Optional[ConflictToleranceConfig] = None,
) -> ConflictDetectionResponse:
    """
    Evaluates dataset-wide conflicts across all matched and unmatched entities in both directions.
    """
    if config is None:
        config = ConflictToleranceConfig()

    # Index rows by entity ID for fast geometry and attribute retrieval
    dict_a = {}
    for _, row in gdf_a.iterrows():
        eid = _get_entity_id(row, fallback_prefix="A")
        dict_a[eid] = row

    dict_b = {}
    for _, row in gdf_b.iterrows():
        eid = _get_entity_id(row, fallback_prefix="B")
        dict_b[eid] = row

    entity_results: List[EntityConflicts] = []
    matched_b_ids: Set[str] = set()

    type_counts: Dict[str, int] = {}
    severity_counts: Dict[str, int] = {
        ConflictSeverity.LOW.value: 0,
        ConflictSeverity.MEDIUM.value: 0,
        ConflictSeverity.HIGH.value: 0,
    }

    # Evaluate all matches (direction A -> B)
    for match in matching_response.matches:
        row_a = dict_a.get(match.source_record_a)
        geom_a = row_a.geometry if row_a is not None else None

        row_b = dict_b.get(match.source_record_b) if match.source_record_b else None
        geom_b = row_b.geometry if row_b is not None else None

        if match.source_record_b:
            matched_b_ids.add(match.source_record_b)

        conflicts = evaluate_match_conflicts(match, geom_a, geom_b, config=config)

        for c in conflicts:
            type_counts[c.type] = type_counts.get(c.type, 0) + 1
            severity_counts[c.severity] = severity_counts.get(c.severity, 0) + 1

        entity_results.append(
            EntityConflicts(
                entity_id_a=match.source_record_a,
                entity_id_b=match.source_record_b,
                has_conflicts=len(conflicts) > 0,
                conflicts=conflicts,
            )
        )

    # Check reverse direction: records in B that were never matched to any record in A
    for eid_b, row_b in dict_b.items():
        if eid_b not in matched_b_ids:
            rev_conflict = detect_missing_record_conflict(eid_b, direction="missing_in_cadastral")
            type_counts[rev_conflict.type] = type_counts.get(rev_conflict.type, 0) + 1
            severity_counts[rev_conflict.severity] = severity_counts.get(rev_conflict.severity, 0) + 1

            entity_results.append(
                EntityConflicts(
                    entity_id_a="NONE",
                    entity_id_b=eid_b,
                    has_conflicts=True,
                    conflicts=[rev_conflict],
                )
            )

    entities_with_conflicts = sum(1 for e in entity_results if e.has_conflicts)

    return ConflictDetectionResponse(
        success=True,
        total_entities_evaluated=len(entity_results),
        entities_with_conflicts_count=entities_with_conflicts,
        conflict_counts_by_type=type_counts,
        conflict_counts_by_severity=severity_counts,
        results=entity_results,
    )
