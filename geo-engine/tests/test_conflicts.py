import os
import json
import pytest
import geopandas as gpd
from fastapi.testclient import TestClient

from app.main import app
from app.models.conflicts import ConflictToleranceConfig
from app.services.matching import match_datasets
from app.services.conflicts import (
    detect_owner_conflict,
    detect_area_conflict,
    detect_boundary_conflict,
    detect_missing_record_conflict,
    detect_dataset_conflicts,
)

client = TestClient(app)

SAMPLE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))


@pytest.fixture(scope="module")
def conflict_evaluation():
    cad_path = os.path.join(SAMPLE_DATA_DIR, "cadastral.geojson")
    mun_path = os.path.join(SAMPLE_DATA_DIR, "municipal.geojson")
    cad = gpd.read_file(cad_path).to_crs("EPSG:32643")
    mun = gpd.read_file(mun_path).to_crs("EPSG:32643")

    match_res = match_datasets(cad, mun)
    conf_res = detect_dataset_conflicts(cad, mun, match_res)
    return cad, mun, match_res, conf_res


def test_case_a_clean_no_conflicts(conflict_evaluation):
    """Case A (P101 vs M-101): Perfect match should produce 0 conflicts."""
    _, _, _, conf_res = conflict_evaluation
    entity_a = next((e for e in conf_res.results if e.entity_id_a == "P101"), None)
    assert entity_a is not None
    assert entity_a.entity_id_b == "M-101"
    assert entity_a.has_conflicts is False
    assert len(entity_a.conflicts) == 0


def test_case_b_name_abbreviation_variance(conflict_evaluation):
    """Case B (P102 vs M-102): Name format variance ('Priya Sharma' vs 'P. Sharma') produces 0 blocking conflicts."""
    _, _, _, conf_res = conflict_evaluation
    entity_b = next((e for e in conf_res.results if e.entity_id_a == "P102"), None)
    assert entity_b is not None
    assert entity_b.entity_id_b == "M-102"
    assert entity_b.has_conflicts is False
    assert len(entity_b.conflicts) == 0


def test_case_c_owner_conflict(conflict_evaluation):
    """Case C (P103 vs M-103): 'Ravi Kumar' vs 'Amit Singh' flags OWNER_MISMATCH with HIGH severity."""
    _, _, _, conf_res = conflict_evaluation
    entity_c = next((e for e in conf_res.results if e.entity_id_a == "P103"), None)
    assert entity_c is not None
    assert entity_c.entity_id_b == "M-103"
    assert entity_c.has_conflicts is True
    owner_conf = next((c for c in entity_c.conflicts if c.type == "OWNER_MISMATCH"), None)
    assert owner_conf is not None
    assert owner_conf.severity == "HIGH"
    assert "Amit Singh" in owner_conf.description
    assert "Ravi Kumar" in owner_conf.description


def test_case_d_area_discrepancy(conflict_evaluation):
    """Case D (P104 vs M-104): 500 m² vs 603.8 m² flags AREA_MISMATCH with HIGH severity."""
    _, _, _, conf_res = conflict_evaluation
    entity_d = next((e for e in conf_res.results if e.entity_id_a == "P104"), None)
    assert entity_d is not None
    assert entity_d.entity_id_b == "M-104"
    assert entity_d.has_conflicts is True
    area_conf = next((c for c in entity_d.conflicts if c.type == "AREA_MISMATCH"), None)
    assert area_conf is not None
    assert area_conf.severity == "HIGH"
    assert "500.0 m²" in area_conf.description
    assert "603.8 m²" in area_conf.description


def test_case_e_boundary_mismatch(conflict_evaluation):
    """Case E (P105 vs M-105): 5m/4m spatial offset (IoU 47.1%) flags BOUNDARY_MISMATCH with HIGH severity."""
    _, _, _, conf_res = conflict_evaluation
    entity_e = next((e for e in conf_res.results if e.entity_id_a == "P105"), None)
    assert entity_e is not None
    assert entity_e.entity_id_b == "M-105"
    assert entity_e.has_conflicts is True
    boundary_conf = next((c for c in entity_e.conflicts if c.type == "BOUNDARY_MISMATCH"), None)
    assert boundary_conf is not None
    assert boundary_conf.severity == "HIGH"
    assert "IoU" in boundary_conf.description or "boundary" in boundary_conf.description.lower()


def test_case_f_missing_municipal_record(conflict_evaluation):
    """Case F (P106): Present in Cadastral but absent in Municipal flags MISSING_MUNICIPAL_RECORD."""
    _, _, _, conf_res = conflict_evaluation
    entity_f = next((e for e in conf_res.results if e.entity_id_a == "P106"), None)
    assert entity_f is not None
    assert entity_f.entity_id_b is None
    assert entity_f.has_conflicts is True
    missing_conf = next((c for c in entity_f.conflicts if c.type == "MISSING_MUNICIPAL_RECORD"), None)
    assert missing_conf is not None
    assert missing_conf.severity == "HIGH"
    assert "P106" in missing_conf.description


def test_case_g_compounding_conflicts(conflict_evaluation):
    """Case G (P107 vs M-106): Multiple conflicts (BOUNDARY_MISMATCH, AREA_MISMATCH, OWNER_MISMATCH)."""
    _, _, _, conf_res = conflict_evaluation
    entity_g = next((e for e in conf_res.results if e.entity_id_a == "P107"), None)
    assert entity_g is not None
    assert entity_g.entity_id_b == "M-106"
    assert entity_g.has_conflicts is True
    conflict_types = {c.type for c in entity_g.conflicts}
    assert "BOUNDARY_MISMATCH" in conflict_types
    assert "AREA_MISMATCH" in conflict_types
    assert "OWNER_MISMATCH" in conflict_types


def test_missing_cadastral_record_detection():
    """Verify bidirectional detection: municipal record absent from cadastral flags MISSING_CADASTRAL_RECORD."""
    item = detect_missing_record_conflict("M-999", direction="missing_in_cadastral")
    assert item.type == "MISSING_CADASTRAL_RECORD"
    assert item.severity == "HIGH"
    assert "M-999" in item.description


def test_custom_tolerance_suppression():
    """When tolerances are configured higher than the observed discrepancy, no conflict is raised."""
    lenient_config = ConflictToleranceConfig(area_pct_tolerance=0.30, area_abs_tolerance=200.0)
    conflict = detect_area_conflict(500.0, 603.8, lenient_config)
    assert conflict is None


def test_api_conflicts_endpoint():
    """Test full HTTP POST /conflicts endpoint."""
    cad_path = os.path.join(SAMPLE_DATA_DIR, "cadastral.geojson")
    mun_path = os.path.join(SAMPLE_DATA_DIR, "municipal.geojson")

    with open(cad_path, "rb") as fa, open(mun_path, "rb") as fb:
        response = client.post(
            "/conflicts",
            files={
                "file_a": ("cadastral.geojson", fa, "application/geo+json"),
                "file_b": ("municipal.geojson", fb, "application/geo+json"),
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_entities_evaluated"] == 29
    assert data["entities_with_conflicts_count"] == 5

    # Check required output shape on all conflict items
    for res in data["results"]:
        for c in res["conflicts"]:
            assert "type" in c
            assert "severity" in c
            assert c["severity"] in ["LOW", "MEDIUM", "HIGH"]
            assert "description" in c
