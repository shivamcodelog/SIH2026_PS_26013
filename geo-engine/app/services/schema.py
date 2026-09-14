import difflib
import re
from typing import Dict, List, Set, Any

# Canonical fields targeted by the normalization engine
CANONICAL_FIELDS: Set[str] = {"owner_name", "area", "parcel_id"}

# Known alias dictionary: canonical_field -> list of common variations / abbreviations
KNOWN_ALIASES: Dict[str, List[str]] = {
    "owner_name": [
        "owner_name",
        "holder_name",
        "landholder",
        "land_holder",
        "owner",
        "proprietor",
        "claimant",
        "name",
        "owner_full_name",
    ],
    "area": [
        "area",
        "plot_area",
        "parcel_area",
        "land_area",
        "building_area",
        "total_area",
        "sq_m",
        "sqm",
        "area_sqm",
        "area_m2",
    ],
    "parcel_id": [
        "parcel_id",
        "property_id",
        "building_id",
        "khasra_no",
        "survey_no",
        "plot_no",
        "parcel_no",
        "id",
        "gid",
    ],
}

# Reverse lookup for O(1) exact alias matching: normalized_alias -> canonical_field
_ALIAS_LOOKUP: Dict[str, str] = {}
for canonical, aliases in KNOWN_ALIASES.items():
    for alias in aliases:
        norm = re.sub(r"[_\-\s]+", "", alias.lower())
        _ALIAS_LOOKUP[norm] = canonical

# Fields that should never be mapped to canonical attributes
PASSTHROUGH_FIELDS: Set[str] = {"geometry", "type", "id", "_id", "feature"}


def _normalize_key(key: str) -> str:
    """Normalize a key for matching (lowercase, stripped of underscores and dashes)."""
    return re.sub(r"[_\-\s]+", "", key.strip().lower())


def detect_field_mapping(source_field: str) -> str | None:
    """
    Detects if a source field name corresponds to one of the canonical fields.
    Uses exact lookup first, followed by difflib fuzzy matching.
    """
    if source_field.lower() in PASSTHROUGH_FIELDS:
        return None

    norm_field = _normalize_key(source_field)

    # 1. Exact alias match
    if norm_field in _ALIAS_LOOKUP:
        return _ALIAS_LOOKUP[norm_field]

    # 2. Fuzzy matching across all known aliases
    all_normalized_aliases = list(_ALIAS_LOOKUP.keys())
    close_matches = difflib.get_close_matches(norm_field, all_normalized_aliases, n=1, cutoff=0.75)
    if close_matches:
        best_match = close_matches[0]
        return _ALIAS_LOOKUP[best_match]

    return None


def detect_schema_mapping(columns_or_properties: List[str]) -> Dict[str, str]:
    """
    Given a list of column or property names, detects mappings to canonical fields.
    Returns: Dict[source_field, canonical_field] for all mapped fields.
    """
    mapping: Dict[str, str] = {}
    for col in columns_or_properties:
        canonical = detect_field_mapping(col)
        if canonical:
            mapping[col] = canonical
    return mapping


def apply_schema_mapping(properties: Dict[str, Any], mapping: Dict[str, str]) -> Dict[str, Any]:
    """
    Applies schema mapping additively to a feature's properties dictionary.
    Preserves original source fields untouched to guarantee data provenance,
    and populates canonical fields (owner_name, area, parcel_id) if not already present.
    """
    updated_props = dict(properties)

    for src_key, canonical_target in mapping.items():
        if src_key in updated_props and updated_props[src_key] is not None:
            # Only set canonical field if not already explicitly populated
            if canonical_target not in updated_props or updated_props[canonical_target] is None:
                updated_props[canonical_target] = updated_props[src_key]

    return updated_props
