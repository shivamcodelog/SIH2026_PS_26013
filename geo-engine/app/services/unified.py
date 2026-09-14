"""
Mission 7 — Unified Record Generation Service.

Produces the §13 unified record shape for every match result from the matching
and conflict detection engines.

Geometry Selection Rule (documented, never silent):
  • If a match exists and spatial IoU >= `geometry_iou_prefer_cadastral` (default 0.85):
        → CADASTRAL_PREFERRED  — high-overlap, use cadastral as canonical geometry.
  • If a match exists and spatial IoU < `geometry_iou_prefer_cadastral`:
        → MUNICIPAL_PREFERRED  — boundaries diverge; flag for review, still traceable.
  • If record has no match in B (UNMATCHED):
        → UNMATCHED_CADASTRAL  — only cadastral geometry available.
  • If geometry is absent in both:
        → NO_GEOMETRY

Owner Name Resolution:
  • Prefer cadastral owner_name. If null/empty fall back to municipal owner_name.
  • If genuinely conflicting (attribute_score < 0.60 and both present):
        → set owner_name = null, let human resolve; OWNER_MISMATCH will appear in conflicts[].

Area Resolution:
  • Prefer cadastral attribute area. Fall back to municipal. Fall back to geometry area.
  • Stored as float (m²), rounded to 2 decimal places.

Sources (flat MVP provenance):
  • Always includes "cadastral" (source A).
  • Includes "municipal" when source_record_b is present.
  • (Buildings/drone not in current pipeline — reserved field via building_id).

Status derivation mirrors the matcher:
  • confidence >= confidence_threshold  → AUTO_VERIFIED
  • confidence <  confidence_threshold  → REQUIRES_REVIEW
  • UNMATCHED records                   → REQUIRES_REVIEW
  • HUMAN_VERIFIED / REJECTED are manual overrides, not assigned automatically.
"""

from typing import Any, Dict, List, Optional

import geopandas as gpd

from app.models.unified import (
    GeometrySelectionRule,
    UnifiedRecord,
    UnifiedRecordGenerationConfig,
    UnifiedRecordGenerationResponse,
    UnifiedStatus,
)
from app.models.matching import MatchRecord, MatchingResponse
from app.models.conflicts import ConflictDetectionResponse, EntityConflicts
from app.services.matching import _get_entity_id, _get_entity_name, _get_entity_area


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resolve_owner(
    name_a: Optional[str],
    name_b: Optional[str],
    attribute_score: float,
) -> Optional[str]:
    """
    Canonical owner resolution rule:
      1. Prefer cadastral (name_a) when non-null.
      2. Fall back to municipal (name_b) when cadastral is missing.
      3. When both are present but genuinely differ (attribute_score < 0.60):
         return None so a human can resolve — a conflict will also be raised.
    """
    has_a = bool(name_a and name_a.strip())
    has_b = bool(name_b and name_b.strip())

    if not has_a and not has_b:
        return None
    if has_a and not has_b:
        return name_a.strip()  # type: ignore[union-attr]
    if has_b and not has_a:
        return name_b.strip()  # type: ignore[union-attr]

    # Both present — check compatibility
    if attribute_score >= 0.60:
        # Acceptable variance (abbreviations, minor typos): prefer cadastral
        return name_a.strip()  # type: ignore[union-attr]

    # Genuinely different names — null out; flag for human resolution
    return None


def _resolve_area(
    area_a: Optional[float],
    area_b: Optional[float],
    geom_a=None,
    geom_b=None,
) -> Optional[float]:
    """
    Canonical area resolution rule:
      1. Prefer cadastral attribute area.
      2. Fall back to municipal attribute area.
      3. Fall back to cadastral geometric area.
      4. Fall back to municipal geometric area.
      5. None if no area is determinable.
    """
    if area_a and area_a > 0:
        return round(area_a, 2)
    if area_b and area_b > 0:
        return round(area_b, 2)
    if geom_a and not geom_a.is_empty and geom_a.area > 0:
        return round(geom_a.area, 2)
    if geom_b and not geom_b.is_empty and geom_b.area > 0:
        return round(geom_b.area, 2)
    return None


def _select_geometry_rule(
    match: MatchRecord,
    config: UnifiedRecordGenerationConfig,
) -> GeometrySelectionRule:
    """
    Determines and returns the geometry selection rule for a match.
    The choice is never arbitrary or silent — always documented in the record.
    """
    if match.status == "UNMATCHED" or match.source_record_b is None:
        return GeometrySelectionRule.UNMATCHED_CADASTRAL

    if match.spatial_score >= config.geometry_iou_prefer_cadastral:
        return GeometrySelectionRule.CADASTRAL_PREFERRED

    # IoU below preference threshold — boundaries diverge, flag as municipal-preferred
    # so reviewer knows the cadastral geometry is not authoritative for this record.
    return GeometrySelectionRule.MUNICIPAL_PREFERRED


def _build_conflict_index(
    conflict_response: Optional[ConflictDetectionResponse],
) -> Dict[str, EntityConflicts]:
    """
    Builds a lookup dict {entity_id_a -> EntityConflicts} from the conflict response
    for O(1) lookup during record assembly.
    """
    if conflict_response is None:
        return {}
    return {ec.entity_id_a: ec for ec in conflict_response.results}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_unified_records(
    gdf_a: gpd.GeoDataFrame,
    gdf_b: gpd.GeoDataFrame,
    matching_response: MatchingResponse,
    conflict_response: Optional[ConflictDetectionResponse] = None,
    config: Optional[UnifiedRecordGenerationConfig] = None,
) -> UnifiedRecordGenerationResponse:
    """
    Produces one unified record per match in `matching_response`.

    Every record is fully traceable to its source records via:
      - source_record_a (cadastral ID)
      - source_record_b (municipal ID, or None for UNMATCHED)
      - sources[] array
      - geometry_selection_rule (documented, never silent)
      - conflict_details[] (full conflict objects from Mission 6)

    Args:
        gdf_a:              Cadastral GeoDataFrame (primary / "A" dataset).
        gdf_b:              Municipal GeoDataFrame (secondary / "B" dataset).
        matching_response:  Output from Mission 5 matching engine.
        conflict_response:  Output from Mission 6 conflict detection (optional).
        config:             Geometry and status thresholds (defaults to §10/§12 spec values).

    Returns:
        UnifiedRecordGenerationResponse with a fully populated `records` list.
    """
    if config is None:
        config = UnifiedRecordGenerationConfig()

    # Index rows by entity ID for O(1) attribute/geometry retrieval
    dict_a: Dict[str, Any] = {}
    for _, row in gdf_a.iterrows():
        eid = _get_entity_id(row, fallback_prefix="A")
        dict_a[eid] = row

    dict_b: Dict[str, Any] = {}
    for _, row in gdf_b.iterrows():
        eid = _get_entity_id(row, fallback_prefix="B")
        dict_b[eid] = row

    conflict_index = _build_conflict_index(conflict_response)

    unified_records: List[UnifiedRecord] = []
    auto_verified_count = 0
    requires_review_count = 0
    unmatched_count = 0

    for match in matching_response.matches:
        row_a = dict_a.get(match.source_record_a)
        row_b = dict_b.get(match.source_record_b) if match.source_record_b else None

        geom_a = row_a.geometry if row_a is not None else None
        geom_b = row_b.geometry if row_b is not None else None

        # --- Attribute extraction ---
        name_a = _get_entity_name(row_a) if row_a is not None else None
        name_b = _get_entity_name(row_b) if row_b is not None else None
        area_a = _get_entity_area(row_a) if row_a is not None else None
        area_b = _get_entity_area(row_b) if row_b is not None else None

        # --- Canonical field resolution ---
        owner = _resolve_owner(name_a, name_b, match.attribute_score)
        area = _resolve_area(area_a, area_b, geom_a, geom_b)
        geom_rule = _select_geometry_rule(match, config)

        # --- Conflict extraction ---
        entity_conflicts = conflict_index.get(match.source_record_a)
        conflict_items = entity_conflicts.conflicts if entity_conflicts else []
        conflict_type_strs = [c.type for c in conflict_items]
        conflict_detail_dicts = [c.model_dump() for c in conflict_items]

        # --- Sources (flat provenance) ---
        sources: List[str] = ["cadastral"]
        if match.source_record_b is not None:
            sources.append("municipal")

        # --- Status derivation ---
        if match.status == "UNMATCHED":
            status = UnifiedStatus.REQUIRES_REVIEW
            unmatched_count += 1
        elif match.confidence >= config.confidence_threshold:
            status = UnifiedStatus.AUTO_VERIFIED
            auto_verified_count += 1
        else:
            status = UnifiedStatus.REQUIRES_REVIEW
            requires_review_count += 1

        # --- Confidence scaling (raw 0–1 → 0–100 percentage as per §13) ---
        confidence_pct = round(match.confidence * 100, 1)

        unified_records.append(
            UnifiedRecord(
                parcel_id=match.source_record_a,
                owner_name=owner,
                area=area,
                building_id=None,  # Drone dataset not yet in pipeline; reserved field
                confidence=confidence_pct,
                status=status,
                sources=sources,
                conflicts=conflict_type_strs,
                source_record_a=match.source_record_a,
                source_record_b=match.source_record_b,
                geometry_selection_rule=geom_rule,
                spatial_score=match.spatial_score,
                area_score=match.area_score,
                attribute_score=match.attribute_score,
                conflict_details=conflict_detail_dicts,
            )
        )

    return UnifiedRecordGenerationResponse(
        success=True,
        total_records=len(unified_records),
        auto_verified_count=auto_verified_count,
        requires_review_count=requires_review_count,
        unmatched_count=unmatched_count,
        records=unified_records,
    )
