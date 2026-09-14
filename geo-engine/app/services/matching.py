import difflib
from typing import Optional, List, Dict, Any, Tuple
import geopandas as gpd
from shapely.geometry.base import BaseGeometry
from shapely.strtree import STRtree

from app.models.matching import (
    MatchingConfig,
    MatchingWeights,
    MatchRecord,
    MatchingResponse,
)


def compute_spatial_score(geom_a: Optional[BaseGeometry], geom_b: Optional[BaseGeometry]) -> float:
    """
    Computes spatial similarity as Intersection over Union (IoU) of two geometries.
    Returns: float in range [0.0, 1.0].
    """
    if geom_a is None or geom_b is None:
        return 0.0
    if geom_a.is_empty or geom_b.is_empty:
        return 0.0

    try:
        inter = geom_a.intersection(geom_b).area
        union = geom_a.union(geom_b).area
        if union <= 0.0:
            return 0.0
        return round(max(0.0, min(1.0, inter / union)), 4)
    except Exception:
        return 0.0


def compute_area_score(
    area_a: Optional[float],
    area_b: Optional[float],
    geom_a: Optional[BaseGeometry] = None,
    geom_b: Optional[BaseGeometry] = None,
) -> float:
    """
    Computes area similarity using formula: 1 - abs(a - b) / max(a, b).
    If attribute area is missing or non-positive, falls back to geometric area.
    Returns: float in range [0.0, 1.0].
    """
    a = float(area_a) if area_a is not None and area_a > 0 else (geom_a.area if geom_a else 0.0)
    b = float(area_b) if area_b is not None and area_b > 0 else (geom_b.area if geom_b else 0.0)

    if a <= 0.0 and b <= 0.0:
        return 1.0
    m = max(a, b)
    if m <= 0.0:
        return 0.0

    score = 1.0 - (abs(a - b) / m)
    return round(max(0.0, min(1.0, score)), 4)


def compute_attribute_score(name_a: Optional[str], name_b: Optional[str]) -> float:
    """
    Computes fuzzy name / attribute similarity.
    Recognizes exact match, name abbreviation format variance (e.g. 'Priya Sharma' vs 'P. Sharma'),
    and falls back to character sequence similarity.
    Returns: float in range [0.0, 1.0].
    """
    if not name_a or not name_b:
        return 0.0

    str_a = str(name_a).strip().lower()
    str_b = str(name_b).strip().lower()

    if not str_a or not str_b:
        return 0.0

    # 1. Exact string match
    if str_a == str_b:
        return 1.0

    # 2. Token-aware abbreviation match (e.g. 'Priya Sharma' vs 'P. Sharma')
    tokens_a = [t.strip(".,") for t in str_a.split() if t.strip(".,")]
    tokens_b = [t.strip(".,") for t in str_b.split() if t.strip(".,")]

    if len(tokens_a) == len(tokens_b) and len(tokens_a) >= 2:
        matches = 0
        is_abbreviation = False
        for ta, tb in zip(tokens_a, tokens_b):
            if ta == tb:
                matches += 1
            elif (len(ta) == 1 and tb.startswith(ta)) or (len(tb) == 1 and ta.startswith(tb)):
                matches += 1
                is_abbreviation = True

        if matches == len(tokens_a) and is_abbreviation:
            return 0.92  # High confidence name format variance

    # 3. Fallback to sequence matcher ratio
    ratio = difflib.SequenceMatcher(None, str_a, str_b).ratio()
    return round(ratio, 4)


def compute_confidence(
    spatial_score: float,
    area_score: float,
    attribute_score: float,
    weights: MatchingWeights,
) -> float:
    """
    Combines component scores into overall confidence score via §10 formula:
    Confidence = weights.spatial * spatial_score + weights.area * area_score + weights.attribute * attribute_score
    """
    raw_conf = (
        weights.spatial * spatial_score
        + weights.area * area_score
        + weights.attribute * attribute_score
    )
    return round(max(0.0, min(1.0, raw_conf)), 4)


def _get_entity_id(row: Any, fallback_prefix: str = "REC") -> str:
    """Extracts entity ID using common ID column names or fallback."""
    for col in ["parcel_id", "property_id", "building_id", "id", "gid", "khasra_no", "survey_no"]:
        if col in row and row[col] is not None:
            val = str(row[col]).strip()
            if val:
                return val
    return f"{fallback_prefix}_{id(row)}"


def _get_entity_name(row: Any) -> Optional[str]:
    """Extracts owner/holder name using canonical or alias columns."""
    for col in ["owner_name", "holder_name", "landholder", "owner", "proprietor", "name"]:
        if col in row and row[col] is not None:
            val = str(row[col]).strip()
            if val:
                return val
    return None


def _get_entity_area(row: Any) -> Optional[float]:
    """Extracts reported area using canonical or alias columns."""
    for col in ["area", "plot_area", "parcel_area", "land_area", "building_area"]:
        if col in row and row[col] is not None:
            try:
                val = float(row[col])
                if val > 0:
                    return val
            except (ValueError, TypeError):
                pass
    return None


def generate_candidate_pairs(
    gdf_a: gpd.GeoDataFrame,
    gdf_b: gpd.GeoDataFrame,
    buffer_distance: float = 15.0,
) -> Dict[int, List[int]]:
    """
    Generates spatial candidate pairs using STRtree spatial indexing.
    Returns: Dict[index_a -> List[index_b]] for candidate matches within buffer.
    Avoids O(N*M) brute force comparisons.
    """
    if gdf_a.empty or gdf_b.empty:
        return {}

    geometries_b = gdf_b.geometry.tolist()
    tree = STRtree(geometries_b)

    candidates: Dict[int, List[int]] = {}
    for idx_a, geom_a in enumerate(gdf_a.geometry):
        if geom_a is None or geom_a.is_empty:
            candidates[idx_a] = []
            continue

        search_geom = geom_a.buffer(buffer_distance) if buffer_distance > 0 else geom_a
        matched_indices = tree.query(search_geom).tolist()
        candidates[idx_a] = matched_indices

    return candidates


def match_datasets(
    gdf_a: gpd.GeoDataFrame,
    gdf_b: gpd.GeoDataFrame,
    config: Optional[MatchingConfig] = None,
) -> MatchingResponse:
    """
    Executes spatial and attribute entity matching between two datasets:
      1. Uses spatial index candidate generation to find potential entity pairs.
      2. Computes explainable component scores (spatial IoU, area ratio, fuzzy name).
      3. Calculates overall weighted confidence.
      4. Assigns status: AUTO_VERIFIED (>= threshold), REQUIRES_REVIEW (< threshold), or UNMATCHED.
    """
    if config is None:
        config = MatchingConfig()

    candidate_map = generate_candidate_pairs(gdf_a, gdf_b, buffer_distance=config.candidate_buffer_m)

    total_candidates_evaluated = sum(len(cands) for cands in candidate_map.values())
    match_records: List[MatchRecord] = []

    auto_verified_count = 0
    requires_review_count = 0
    unmatched_count = 0

    for idx_a in range(len(gdf_a)):
        row_a = gdf_a.iloc[idx_a]
        id_a = _get_entity_id(row_a, fallback_prefix="A")
        name_a = _get_entity_name(row_a)
        area_a = _get_entity_area(row_a)
        geom_a = row_a.geometry

        cand_indices_b = candidate_map.get(idx_a, [])

        if not cand_indices_b:
            # Case: No spatial candidate in dataset B
            unmatched_count += 1
            match_records.append(
                MatchRecord(
                    source_record_a=id_a,
                    source_record_b=None,
                    spatial_score=0.0,
                    area_score=0.0,
                    attribute_score=0.0,
                    confidence=0.0,
                    status="UNMATCHED",
                    details={
                        "owner_name_a": name_a,
                        "area_a": area_a,
                        "reason": "No spatial candidate found in candidate dataset within buffer tolerance.",
                    },
                )
            )
            continue

        # Evaluate all candidate pairs for this record and pick the best matching one
        best_match: Optional[MatchRecord] = None
        highest_conf = -1.0

        for idx_b in cand_indices_b:
            row_b = gdf_b.iloc[idx_b]
            id_b = _get_entity_id(row_b, fallback_prefix="B")
            name_b = _get_entity_name(row_b)
            area_b = _get_entity_area(row_b)
            geom_b = row_b.geometry

            # Calculate individual component scores
            spatial = compute_spatial_score(geom_a, geom_b)
            if spatial < config.min_spatial_score:
                # Discard candidates that merely graze or don't meet minimum viable spatial overlap
                continue

            area = compute_area_score(area_a, area_b, geom_a, geom_b)
            attr = compute_attribute_score(name_a, name_b)

            conf = compute_confidence(spatial, area, attr, config.weights)

            status = "AUTO_VERIFIED" if conf >= config.threshold else "REQUIRES_REVIEW"

            rec = MatchRecord(
                source_record_a=id_a,
                source_record_b=id_b,
                spatial_score=spatial,
                area_score=area,
                attribute_score=attr,
                confidence=conf,
                status=status,
                details={
                    "owner_name_a": name_a,
                    "owner_name_b": name_b,
                    "area_a": area_a or (geom_a.area if geom_a else None),
                    "area_b": area_b or (geom_b.area if geom_b else None),
                    "weights_used": config.weights.model_dump(),
                    "threshold_applied": config.threshold,
                },
            )

            if conf > highest_conf:
                highest_conf = conf
                best_match = rec

        if best_match:
            match_records.append(best_match)
            if best_match.status == "AUTO_VERIFIED":
                auto_verified_count += 1
            else:
                requires_review_count += 1
        else:
            # No viable candidate met the minimum spatial overlap threshold
            unmatched_count += 1
            match_records.append(
                MatchRecord(
                    source_record_a=id_a,
                    source_record_b=None,
                    spatial_score=0.0,
                    area_score=0.0,
                    attribute_score=0.0,
                    confidence=0.0,
                    status="UNMATCHED",
                    details={
                        "owner_name_a": name_a,
                        "area_a": area_a,
                        "reason": f"No candidate achieved minimum spatial IoU threshold of {config.min_spatial_score}.",
                    },
                )
            )

    return MatchingResponse(
        success=True,
        total_records_a=len(gdf_a),
        total_records_b=len(gdf_b),
        total_candidates_evaluated=total_candidates_evaluated,
        auto_verified_count=auto_verified_count,
        requires_review_count=requires_review_count,
        unmatched_a_count=unmatched_count,
        matches=match_records,
    )
