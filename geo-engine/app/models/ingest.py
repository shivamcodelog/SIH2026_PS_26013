from typing import Dict, List
from pydantic import BaseModel, Field


class ValidationSummary(BaseModel):
    valid: int = Field(..., description="Count of geometries that were already valid")
    repaired: int = Field(..., description="Count of geometries successfully repaired")
    invalid: int = Field(..., description="Count of geometries that could not be repaired")


class IngestionResponse(BaseModel):
    success: bool = Field(True, description="Indicates whether ingestion and processing succeeded")
    records_processed: int = Field(..., description="Total number of records processed")
    crs: str = Field(..., description="Normalized projected CRS or 'CRS_REVIEW_REQUIRED'")
    geometry_types: List[str] = Field(..., description="List of unique geometry types found in the dataset")
    schema_mapping: Dict[str, str] = Field(..., description="Detected field name alias mappings (source -> canonical)")
    validation: ValidationSummary = Field(..., description="Geometry validation and repair counts")
