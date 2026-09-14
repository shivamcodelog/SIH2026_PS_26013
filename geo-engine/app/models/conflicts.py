from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field


class ConflictSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ConflictType(str, Enum):
    OWNER_MISMATCH = "OWNER_MISMATCH"
    AREA_MISMATCH = "AREA_MISMATCH"
    BOUNDARY_MISMATCH = "BOUNDARY_MISMATCH"
    MISSING_MUNICIPAL_RECORD = "MISSING_MUNICIPAL_RECORD"
    MISSING_CADASTRAL_RECORD = "MISSING_CADASTRAL_RECORD"
    NAME_FORMAT_VARIANCE = "NAME_FORMAT_VARIANCE"


class ConflictItem(BaseModel):
    type: str = Field(..., description="Machine-readable conflict code, e.g. OWNER_MISMATCH, AREA_MISMATCH")
    severity: str = Field(..., description="'LOW', 'MEDIUM', or 'HIGH'")
    description: str = Field(..., description="Human-readable explanation of the discrepancy")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Diagnostic metrics and raw comparison values")


class ConflictToleranceConfig(BaseModel):
    area_pct_tolerance: float = Field(0.05, ge=0.0, description="Area difference percentage threshold for MEDIUM conflict (default 5%)")
    area_abs_tolerance: float = Field(10.0, ge=0.0, description="Area absolute difference in m² for MEDIUM conflict (default 10 m²)")
    area_high_pct_tolerance: float = Field(0.15, ge=0.0, description="Area difference percentage threshold for HIGH conflict (default 15%)")
    area_high_abs_tolerance: float = Field(50.0, ge=0.0, description="Area absolute difference in m² for HIGH conflict (default 50 m²)")
    boundary_iou_clean_threshold: float = Field(0.85, ge=0.0, le=1.0, description="IoU above which boundary is considered clean (default 85%)")
    boundary_iou_high_severity_threshold: float = Field(0.65, ge=0.0, le=1.0, description="IoU below which boundary mismatch is HIGH severity (default 65%)")
    owner_high_severity_score_threshold: float = Field(0.60, ge=0.0, le=1.0, description="Attribute score below which owner difference is HIGH severity (default 60%)")


class EntityConflicts(BaseModel):
    entity_id_a: str = Field(..., description="ID from dataset A (e.g. parcel_id)")
    entity_id_b: Optional[str] = Field(None, description="ID from dataset B (e.g. property_id) or None if unmatched")
    has_conflicts: bool = Field(..., description="True if one or more conflicts are detected")
    conflicts: List[ConflictItem] = Field(..., description="List of conflict items detected for this entity pair")


class ConflictDetectionResponse(BaseModel):
    success: bool = Field(True, description="Indicates whether conflict detection succeeded")
    total_entities_evaluated: int = Field(..., description="Total entity pairs evaluated")
    entities_with_conflicts_count: int = Field(..., description="Number of entities having at least one conflict")
    conflict_counts_by_type: Dict[str, int] = Field(..., description="Counts of conflicts broken down by type")
    conflict_counts_by_severity: Dict[str, int] = Field(..., description="Counts of conflicts broken down by severity")
    results: List[EntityConflicts] = Field(..., description="Detailed conflicts per entity pair")
