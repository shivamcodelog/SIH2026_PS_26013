import os
import json
import pytest
import geopandas as gpd
from shapely.geometry import Polygon
from fastapi.testclient import TestClient

from app.main import app
from app.services.matching import (
    compute_spatial_score,
    compute_area_score,
    compute_attribute_score,
    compute_confidence,
    generate_candidate_pairs,
    match_datasets,
)
from app.models.matching import MatchingConfig, MatchingWeights

client = TestClient(app)

SAMPLE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))


@pytest.fixture(scope="module")
def sample_datasets():
    cad_path = os.path.join(SAMPLE_DATA_DIR, "cadastral.geojson")
    mun_path = os.path.join(SAMPLE_DATA_DIR, "municipal.geojson")
    cad = gpd.read_file(cad_path).to_crs("EPSG:32643")
    mun = gpd.read_file(mun_path).to_crs("EPSG:32643")
    return cad, mun


def test_exact_match_case_a(sample_datasets):
    """Case A: Identical boundary, area, and owner name -> AUTO_VERIFIED >= 96%."""
    cad, mun = sample_datasets
    res = match_datasets(cad, mun)
    match_a = next((m for m in res.matches if m.source_record_a == "P101"), None)
    assert match_a is not None
    assert match_a.source_record_b == "M-101"
    assert match_a.spatial_score == 1.0
    assert match_a.area_score == 1.0
    assert match_a.attribute_score == 1.0
    assert match_a.confidence >= 0.96
    assert match_a.status == "AUTO_VERIFIED"


def test_name_abbreviation_case_b(sample_datasets):
    """Case B: 'Priya Sharma' vs 'P. Sharma' -> high attribute score -> AUTO_VERIFIED."""
    cad, mun = sample_datasets
    res = match_datasets(cad, mun)
    match_b = next((m for m in res.matches if m.source_record_a == "P102"), None)
    assert match_b is not None
    assert match_b.source_record_b == "M-102"
    assert match_b.attribute_score >= 0.90
    assert match_b.confidence >= 0.90
    assert match_b.status == "AUTO_VERIFIED"


def test_owner_conflict_case_c(sample_datasets):
    """Case C: 'Ravi Kumar' vs 'Amit Singh' -> attribute conflict -> REQUIRES_REVIEW."""
    cad, mun = sample_datasets
    res = match_datasets(cad, mun)
    match_c = next((m for m in res.matches if m.source_record_a == "P103"), None)
    assert match_c is not None
    assert match_c.source_record_b == "M-103"
    assert match_c.attribute_score <= 0.40
    assert match_c.confidence < 0.90
    assert match_c.status == "REQUIRES_REVIEW"


def test_area_mismatch_case_d(sample_datasets):
    """Case D: 500 m² vs 603.8 m² (~20.8% discrepancy) -> REQUIRES_REVIEW."""
    cad, mun = sample_datasets
    res = match_datasets(cad, mun)
    match_d = next((m for m in res.matches if m.source_record_a == "P104"), None)
    assert match_d is not None
    assert match_d.source_record_b == "M-104"
    assert match_d.area_score < 0.85
    assert match_d.confidence < 0.90
    assert match_d.status == "REQUIRES_REVIEW"


def test_boundary_mismatch_case_e(sample_datasets):
    """Case E: 5m and 4m spatial boundary offset -> low spatial IoU -> REQUIRES_REVIEW."""
    cad, mun = sample_datasets
    res = match_datasets(cad, mun)
    match_e = next((m for m in res.matches if m.source_record_a == "P105"), None)
    assert match_e is not None
    assert match_e.source_record_b == "M-105"
    assert match_e.spatial_score < 0.60
    assert match_e.confidence < 0.90
    assert match_e.status == "REQUIRES_REVIEW"


def test_missing_record_case_f(sample_datasets):
    """Case F: P106 exists in cadastral but has no municipal record -> UNMATCHED."""
    cad, mun = sample_datasets
    res = match_datasets(cad, mun)
    match_f = next((m for m in res.matches if m.source_record_a == "P106"), None)
    assert match_f is not None
    assert match_f.source_record_b is None
    assert match_f.status == "UNMATCHED"
    assert match_f.confidence == 0.0


def test_low_confidence_case_g(sample_datasets):
    """Case G: Shifted boundary + smaller area + name divergence -> confidence < 90%."""
    cad, mun = sample_datasets
    res = match_datasets(cad, mun)
    match_g = next((m for m in res.matches if m.source_record_a == "P107"), None)
    assert match_g is not None
    assert match_g.source_record_b == "M-106"
    assert match_g.confidence < 0.90
    assert match_g.status == "REQUIRES_REVIEW"


def test_missing_attributes_handling():
    """Missing or None attributes should be handled safely and explicitly."""
    p1 = Polygon([(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)])
    p2 = Polygon([(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)])

    # Attribute score when names are None or empty
    assert compute_attribute_score(None, "Ravi Kumar") == 0.0
    assert compute_attribute_score("", "") == 0.0

    # Area score when attribute area is None -> falls back to geometry area
    score = compute_area_score(None, None, geom_a=p1, geom_b=p2)
    assert score == 1.0


def test_configurable_weights_and_threshold():
    """Configurable weights and threshold should directly control confidence calculation."""
    # Custom weights: 100% spatial, 0% area, 0% attribute
    weights = MatchingWeights(spatial=1.0, area=0.0, attribute=0.0)
    conf = compute_confidence(0.85, 0.40, 0.20, weights)
    assert conf == 0.85

    # Threshold 0.80 instead of 0.90
    config_lenient = MatchingConfig(threshold=0.80)
    p1 = Polygon([(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)])
    gdf_a = gpd.GeoDataFrame([{"parcel_id": "T1", "geometry": p1, "owner_name": "Test", "area": 100.0}])
    # Offset slightly
    p2 = Polygon([(1, 0), (1, 10), (11, 10), (11, 0), (1, 0)])
    gdf_b = gpd.GeoDataFrame([{"property_id": "M1", "geometry": p2, "holder_name": "Test", "plot_area": 100.0}])

    res = match_datasets(gdf_a, gdf_b, config=config_lenient)
    assert res.matches[0].confidence > 0.80
    assert res.matches[0].status == "AUTO_VERIFIED"


def test_api_match_endpoint():
    """Test full HTTP POST /match endpoint with multipart file uploads."""
    cad_path = os.path.join(SAMPLE_DATA_DIR, "cadastral.geojson")
    mun_path = os.path.join(SAMPLE_DATA_DIR, "municipal.geojson")

    with open(cad_path, "rb") as fa, open(mun_path, "rb") as fb:
        response = client.post(
            "/match",
            files={
                "file_a": ("cadastral.geojson", fa, "application/geo+json"),
                "file_b": ("municipal.geojson", fb, "application/geo+json"),
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_records_a"] == 29
    assert data["total_records_b"] == 28
    assert data["auto_verified_count"] == 24
    assert data["requires_review_count"] == 4
    assert data["unmatched_a_count"] == 1
    assert len(data["matches"]) == 29

    # Verify explainability payload exists on all records
    for m in data["matches"]:
        assert "spatial_score" in m
        assert "area_score" in m
        assert "attribute_score" in m
        assert "confidence" in m
        assert "status" in m
        assert "details" in m
