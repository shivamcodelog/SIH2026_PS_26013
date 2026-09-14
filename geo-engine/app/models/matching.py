from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class MatchingWeights(BaseModel):
    spatial: float = Field(0.50, ge=0.0, le=1.0, description="Weight for spatial overlap similarity (IoU)")
    area: float = Field(0.20, ge=0.0, le=1.0, description="Weight for area ratio similarity")
    attribute: float = Field(0.30, ge=0.0, le=1.0, description="Weight for fuzzy attribute/name similarity")


class MatchingConfig(BaseModel):
    weights: MatchingWeights = Field(default_factory=MatchingWeights, description="Component score weights")
    threshold: float = Field(0.90, ge=0.0, le=1.0, description="Confidence cutoff for AUTO_VERIFIED vs REQUIRES_REVIEW")
    candidate_buffer_m: float = Field(15.0, ge=0.0, description="Spatial index candidate search buffer in meters")
    min_spatial_score: float = Field(0.15, ge=0.0, le=1.0, description="Minimum spatial IoU required to consider a candidate viable")


class MatchRecord(BaseModel):
    source_record_a: str = Field(..., description="ID of record from dataset A (e.g. parcel_id)")
    source_record_b: Optional[str] = Field(None, description="ID of matched record from dataset B (e.g. property_id) or null")
    spatial_score: float = Field(..., ge=0.0, le=1.0, description="IoU spatial overlap score (0.0 - 1.0)")
    area_score: float = Field(..., ge=0.0, le=1.0, description="Area similarity score (0.0 - 1.0)")
    attribute_score: float = Field(..., ge=0.0, le=1.0, description="Attribute / name similarity score (0.0 - 1.0)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Combined weighted confidence (0.0 - 1.0)")
    status: str = Field(..., description="'AUTO_VERIFIED', 'REQUIRES_REVIEW', or 'UNMATCHED'")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Detailed component attributes and explanations")


class MatchingResponse(BaseModel):
    success: bool = Field(True, description="Indicates whether matching completed successfully")
    total_records_a: int = Field(..., description="Total records evaluated from dataset A")
    total_records_b: int = Field(..., description="Total records available in dataset B")
    total_candidates_evaluated: int = Field(..., description="Number of candidate pairs evaluated via spatial index")
    auto_verified_count: int = Field(..., description="Number of matches with confidence >= threshold")
    requires_review_count: int = Field(..., description="Number of candidate matches with confidence < threshold")
    unmatched_a_count: int = Field(..., description="Records in A with no candidate in B")
    matches: List[MatchRecord] = Field(..., description="List of match records with component breakdown")
