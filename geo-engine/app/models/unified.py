"""
Pydantic models for Mission 7 - Unified Record Generation.

The unified record shape follows Section 13 of PROJECT_CONTEXT.md:
  - parcel_id, owner_name, area, building_id, confidence, status, sources, conflicts
  - Status values: AUTO_VERIFIED | REQUIRES_REVIEW | HUMAN_VERIFIED | REJECTED
  - Sources: flat array of contributing dataset names (provenance, per Section 13 MVP scope).
  - Per-field provenance is a documented stretch goal (not required for MVP).
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UnifiedStatus(str, Enum):
    """Permissible status values for a unified record (Section 13)."""

    AUTO_VERIFIED = "AUTO_VERIFIED"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"
    HUMAN_VERIFIED = "HUMAN_VERIFIED"
    REJECTED = "REJECTED"


class GeometrySelectionRule(str, Enum):
    """
    Documents the geometry selection strategy applied during unification.
    Never picked arbitrarily or silently - always recorded in the unified record.
    """

    CADASTRAL_ONLY = "CADASTRAL_ONLY"
    MUNICIPAL_ONLY = "MUNICIPAL_ONLY"
    CADASTRAL_PREFERRED = "CADASTRAL_PREFERRED"
    MUNICIPAL_PREFERRED = "MUNICIPAL_PREFERRED"
    UNMATCHED_CADASTRAL = "UNMATCHED_CADASTRAL"
    NO_GEOMETRY = "NO_GEOMETRY"


class UnifiedRecord(BaseModel):
    """
    The canonical unified record shape from Section 13 of PROJECT_CONTEXT.md.

    Produced for every match. Each record is traceable back to its exact source
    records via source_record_a / source_record_b and the flat `sources` array.
    """

    parcel_id: str = Field(..., description="Primary parcel identifier (from cadastral source).")
    owner_name: Optional[str] = Field(
        None, description="Canonical owner name. Null when missing or irreconcilable."
    )
    area: Optional[float] = Field(
        None, description="Canonical area (m^2). Prefer cadastral when present; else municipal."
    )
    building_id: Optional[str] = Field(
        None, description="Associated building identifier from drone/building dataset (if supplied)."
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall match confidence as a 0-100 percentage (spatial/area/attribute weighted score x 100).",
    )
    status: UnifiedStatus = Field(
        ...,
        description="Verification status: AUTO_VERIFIED | REQUIRES_REVIEW | HUMAN_VERIFIED | REJECTED.",
    )
    sources: List[str] = Field(
        ...,
        description="Flat array of dataset names that contributed to this record.",
    )
    conflicts: List[str] = Field(
        default_factory=list,
        description="List of conflict type strings for this record (e.g. ['OWNER_MISMATCH']).",
    )

    # Provenance and traceability fields
    source_record_a: str = Field(
        ..., description="Source record ID from primary dataset (cadastral)."
    )
    source_record_b: Optional[str] = Field(
        None, description="Source record ID from secondary dataset (municipal), or null."
    )
    geometry_selection_rule: GeometrySelectionRule = Field(
        ...,
        description=(
            "Documents which geometry was chosen and why. "
            "Rule: prefer cadastral geometry when IoU >= geometry_iou_prefer_cadastral threshold; "
            "else flag as REQUIRES_REVIEW. Never selected arbitrarily or silently."
        ),
    )
    spatial_score: float = Field(..., ge=0.0, le=1.0, description="Raw IoU spatial overlap score.")
    area_score: float = Field(..., ge=0.0, le=1.0, description="Raw area ratio similarity score.")
    attribute_score: float = Field(
        ..., ge=0.0, le=1.0, description="Raw fuzzy attribute similarity score."
    )
    conflict_details: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Full conflict item objects (type, severity, description, details) for audit.",
    )


class UnifiedRecordGenerationConfig(BaseModel):
    """Runtime configuration knobs for unified record generation."""

    geometry_iou_prefer_cadastral: float = Field(
        0.85,
        ge=0.0,
        le=1.0,
        description=(
            "IoU threshold above which cadastral geometry is preferred as the canonical boundary. "
            "Below this the record is flagged REQUIRES_REVIEW."
        ),
    )
    confidence_threshold: float = Field(
        0.90,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for AUTO_VERIFIED vs REQUIRES_REVIEW (mirrors matching config).",
    )


class UnifiedRecordGenerationResponse(BaseModel):
    """Response envelope for the /unify endpoint."""

    success: bool = Field(True)
    total_records: int = Field(..., description="Total unified records produced.")
    auto_verified_count: int = Field(...)
    requires_review_count: int = Field(...)
    unmatched_count: int = Field(
        ..., description="Records in A that had no match candidate in B."
    )
    records: List[UnifiedRecord] = Field(..., description="Full list of unified records.")
