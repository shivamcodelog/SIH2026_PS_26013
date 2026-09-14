"""
Tests for Mission 7 — Unified Record Generation (app/services/unified.py).

Tests cover:
  1. Exact-match parcel → AUTO_VERIFIED, CADASTRAL_PREFERRED geometry, correct sources.
  2. Owner name abbreviation → canonical owner resolved to cadastral name.
  3. Conflicting owner names (attribute_score < 0.60) → owner_name = None.
  4. Area resolution: cadastral attribute preferred; falls back to geometry.
  5. UNMATCHED record → REQUIRES_REVIEW, UNMATCHED_CADASTRAL geometry rule, sources = ["cadastral"].
  6. Low-confidence match → REQUIRES_REVIEW, MUNICIPAL_PREFERRED geometry rule.
  7. Conflict type strings propagate from conflict_response into unified record.
  8. Full pipeline smoke-test using Mission 3 synthetic GeoJSON data.
"""

import json
from pathlib import Path
from typing import Optional

import geopandas as gpd
import pytest
from shapely.geometry import Polygon

from app.models.conflicts import (
    ConflictDetectionResponse,
    ConflictItem,
    EntityConflicts,
)
from app.models.matching import MatchRecord, MatchingResponse
from app.models.unified import (
    GeometrySelectionRule,
    UnifiedRecordGenerationConfig,
    UnifiedStatus,
)
from app.services.unified import (
    _resolve_area,
    _resolve_owner,
    _select_geometry_rule,
    generate_unified_records,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SYNTHETIC_DATA_DIR = Path(__file__).parent.parent.parent / "sample-data"


def _make_square(cx: float, cy: float, size: float = 50.0) -> Polygon:
    """Create a square polygon centred at (cx, cy) with given side length."""
    h = size / 2
    return Polygon(
        [(cx - h, cy - h), (cx + h, cy - h), (cx + h, cy + h), (cx - h, cy + h)]
    )


def _minimal_gdf(
    parcel_id: str,
    owner_name: Optional[str],
    area: Optional[float],
    geom: Polygon,
    crs: str = "EPSG:32643",
) -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(
        [{"parcel_id": parcel_id, "owner_name": owner_name, "area": area}],
        geometry=[geom],
        crs=crs,
    )


def _match(
    id_a: str,
    id_b: Optional[str],
    spatial: float,
    area: float,
    attr: float,
    conf: float,
    status: str,
    name_a: Optional[str] = None,
    name_b: Optional[str] = None,
    area_a: Optional[float] = None,
    area_b: Optional[float] = None,
) -> MatchRecord:
    return MatchRecord(
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
            "area_a": area_a,
            "area_b": area_b,
        },
    )


def _matching_response(*matches: MatchRecord) -> MatchingResponse:
    avc = sum(1 for m in matches if m.status == "AUTO_VERIFIED")
    rrc = sum(1 for m in matches if m.status == "REQUIRES_REVIEW")
    umc = sum(1 for m in matches if m.status == "UNMATCHED")
    return MatchingResponse(
        success=True,
        total_records_a=len(matches),
        total_records_b=len(matches),
        total_candidates_evaluated=len(matches),
        auto_verified_count=avc,
        requires_review_count=rrc,
        unmatched_a_count=umc,
        matches=list(matches),
    )


def _conflict_response(entity_id_a: str, conflict_types: list) -> ConflictDetectionResponse:
    items = [
        ConflictItem(type=t, severity="HIGH", description=f"Test conflict: {t}", details={})
        for t in conflict_types
    ]
    ec = EntityConflicts(
        entity_id_a=entity_id_a,
        entity_id_b="some_b",
        has_conflicts=bool(items),
        conflicts=items,
    )
    return ConflictDetectionResponse(
        success=True,
        total_entities_evaluated=1,
        entities_with_conflicts_count=1,
        conflict_counts_by_type={t: 1 for t in conflict_types},
        conflict_counts_by_severity={"HIGH": len(conflict_types)},
        results=[ec],
    )


# ---------------------------------------------------------------------------
# Unit tests — internal helpers
# ---------------------------------------------------------------------------

class TestResolveOwner:
    def test_exact_match_returns_cadastral(self):
        assert _resolve_owner("Ravi Kumar", "Ravi Kumar", 1.0) == "Ravi Kumar"

    def test_abbreviation_acceptable_returns_cadastral(self):
        # attribute_score >= 0.60 → prefer cadastral
        assert _resolve_owner("Priya Sharma", "P. Sharma", 0.92) == "Priya Sharma"

    def test_genuinely_different_returns_none(self):
        # attribute_score < 0.60 → irreconcilable, return None
        result = _resolve_owner("Ravi Kumar", "Amit Singh", 0.12)
        assert result is None

    def test_missing_cadastral_falls_back_to_municipal(self):
        assert _resolve_owner(None, "Anita Desai", 0.0) == "Anita Desai"

    def test_both_missing_returns_none(self):
        assert _resolve_owner(None, None, 0.0) is None

    def test_empty_string_treated_as_missing(self):
        assert _resolve_owner("", "Anita Desai", 0.0) == "Anita Desai"


class TestResolveArea:
    def test_prefer_cadastral_attribute(self):
        assert _resolve_area(246.0, 200.0) == 246.0

    def test_fallback_to_municipal_attribute(self):
        assert _resolve_area(None, 200.0) == 200.0

    def test_fallback_to_cadastral_geometry(self):
        sq = _make_square(0, 0, 10)  # area = 100 m²
        result = _resolve_area(None, None, geom_a=sq)
        assert result == pytest.approx(100.0, abs=0.01)

    def test_none_when_no_area_info(self):
        assert _resolve_area(None, None) is None

    def test_zero_area_not_used(self):
        # Zero areas should be ignored; fall back
        sq = _make_square(0, 0, 10)
        assert _resolve_area(0.0, 0.0, geom_a=sq) == pytest.approx(100.0, abs=0.01)


class TestSelectGeometryRule:
    def _cfg(self, iou_threshold: float = 0.85) -> UnifiedRecordGenerationConfig:
        return UnifiedRecordGenerationConfig(geometry_iou_prefer_cadastral=iou_threshold)

    def test_high_iou_gives_cadastral_preferred(self):
        m = _match("P01", "M01", 0.95, 0.9, 0.9, 0.92, "AUTO_VERIFIED")
        assert _select_geometry_rule(m, self._cfg()) == GeometrySelectionRule.CADASTRAL_PREFERRED

    def test_low_iou_gives_municipal_preferred(self):
        m = _match("P01", "M01", 0.60, 0.9, 0.5, 0.65, "REQUIRES_REVIEW")
        assert _select_geometry_rule(m, self._cfg()) == GeometrySelectionRule.MUNICIPAL_PREFERRED

    def test_unmatched_gives_unmatched_cadastral(self):
        m = _match("P01", None, 0.0, 0.0, 0.0, 0.0, "UNMATCHED")
        assert _select_geometry_rule(m, self._cfg()) == GeometrySelectionRule.UNMATCHED_CADASTRAL


# ---------------------------------------------------------------------------
# Integration tests — generate_unified_records
# ---------------------------------------------------------------------------

class TestGenerateUnifiedRecords:
    """End-to-end tests of the full generation function."""

    DEFAULT_CFG = UnifiedRecordGenerationConfig(
        geometry_iou_prefer_cadastral=0.85,
        confidence_threshold=0.90,
    )

    def _run(self, gdf_a, gdf_b, matching_resp, conflict_resp=None):
        return generate_unified_records(
            gdf_a=gdf_a,
            gdf_b=gdf_b,
            matching_response=matching_resp,
            conflict_response=conflict_resp,
            config=self.DEFAULT_CFG,
        )

    # --- Test 1: Exact match → AUTO_VERIFIED ---
    def test_exact_match_auto_verified(self):
        geom = _make_square(100.0, 100.0, 50.0)
        gdf_a = _minimal_gdf("P01", "Ravi Kumar", 246.0, geom)
        gdf_b = _minimal_gdf("M01", "Ravi Kumar", 246.0, geom)
        match = _match("P01", "M01", 0.98, 1.0, 1.0, 0.98, "AUTO_VERIFIED",
                       "Ravi Kumar", "Ravi Kumar", 246.0, 246.0)
        resp = self._run(gdf_a, gdf_b, _matching_response(match))

        assert resp.success is True
        assert resp.total_records == 1
        assert resp.auto_verified_count == 1
        rec = resp.records[0]
        assert rec.status == UnifiedStatus.AUTO_VERIFIED
        assert rec.parcel_id == "P01"
        assert rec.owner_name == "Ravi Kumar"
        assert rec.area == 246.0
        assert rec.confidence == pytest.approx(98.0, abs=0.1)
        assert rec.sources == ["cadastral", "municipal"]
        assert rec.geometry_selection_rule == GeometrySelectionRule.CADASTRAL_PREFERRED
        assert rec.conflicts == []

    # --- Test 2: Name abbreviation → owner resolved to cadastral name ---
    def test_name_abbreviation_resolves_to_cadastral(self):
        geom = _make_square(200.0, 200.0, 50.0)
        gdf_a = _minimal_gdf("P02", "Priya Sharma", 300.0, geom)
        gdf_b = _minimal_gdf("M02", "P. Sharma", 300.0, geom)
        match = _match("P02", "M02", 0.95, 1.0, 0.92, 0.965, "AUTO_VERIFIED",
                       "Priya Sharma", "P. Sharma", 300.0, 300.0)
        resp = self._run(gdf_a, gdf_b, _matching_response(match))

        rec = resp.records[0]
        assert rec.owner_name == "Priya Sharma"
        assert rec.status == UnifiedStatus.AUTO_VERIFIED

    # --- Test 3: Conflicting owner names → owner_name = None ---
    def test_conflicting_owner_name_becomes_null(self):
        geom = _make_square(300.0, 300.0, 50.0)
        gdf_a = _minimal_gdf("P03", "Ravi Kumar", 200.0, geom)
        gdf_b = _minimal_gdf("M03", "Amit Singh", 200.0, geom)
        match = _match("P03", "M03", 0.90, 1.0, 0.12, 0.484, "REQUIRES_REVIEW",
                       "Ravi Kumar", "Amit Singh", 200.0, 200.0)
        resp = self._run(gdf_a, gdf_b, _matching_response(match))

        rec = resp.records[0]
        assert rec.owner_name is None
        assert rec.status == UnifiedStatus.REQUIRES_REVIEW

    # --- Test 4: Area mismatch → cadastral area preferred, still recorded ---
    def test_area_mismatch_prefers_cadastral(self):
        geom_a = _make_square(400.0, 400.0, 50.0)
        geom_b = _make_square(400.0, 400.0, 60.0)
        gdf_a = _minimal_gdf("P04", "Anita Desai", 500.0, geom_a)
        gdf_b = _minimal_gdf("M04", "Anita Desai", 800.0, geom_b)
        match = _match("P04", "M04", 0.90, 0.625, 1.0, 0.8125, "REQUIRES_REVIEW",
                       "Anita Desai", "Anita Desai", 500.0, 800.0)
        resp = self._run(gdf_a, gdf_b, _matching_response(match))

        rec = resp.records[0]
        assert rec.area == 500.0  # cadastral preferred

    # --- Test 5: UNMATCHED → REQUIRES_REVIEW, sources = ["cadastral"] ---
    def test_unmatched_record(self):
        geom = _make_square(500.0, 500.0, 50.0)
        gdf_a = _minimal_gdf("P05", "Mohan Lal", 250.0, geom)
        gdf_b = _minimal_gdf("M99", "Someone Else", 999.0, _make_square(9999.0, 9999.0))
        match = _match("P05", None, 0.0, 0.0, 0.0, 0.0, "UNMATCHED",
                       "Mohan Lal", None, 250.0, None)
        resp = self._run(gdf_a, gdf_b, _matching_response(match))

        assert resp.unmatched_count == 1
        rec = resp.records[0]
        assert rec.status == UnifiedStatus.REQUIRES_REVIEW
        assert rec.sources == ["cadastral"]
        assert rec.geometry_selection_rule == GeometrySelectionRule.UNMATCHED_CADASTRAL
        assert rec.source_record_b is None

    # --- Test 6: Low-confidence match → REQUIRES_REVIEW, MUNICIPAL_PREFERRED ---
    def test_low_confidence_requires_review(self):
        geom_a = _make_square(600.0, 600.0, 50.0)
        geom_b = _make_square(640.0, 640.0, 50.0)  # offset, low IoU
        gdf_a = _minimal_gdf("P06", "Suresh Nair", 300.0, geom_a)
        gdf_b = _minimal_gdf("M06", "Suresh Nair", 310.0, geom_b)
        match = _match("P06", "M06", 0.30, 0.97, 1.0, 0.544, "REQUIRES_REVIEW",
                       "Suresh Nair", "Suresh Nair", 300.0, 310.0)
        resp = self._run(gdf_a, gdf_b, _matching_response(match))

        rec = resp.records[0]
        assert rec.status == UnifiedStatus.REQUIRES_REVIEW
        assert rec.geometry_selection_rule == GeometrySelectionRule.MUNICIPAL_PREFERRED

    # --- Test 7: Conflict types propagate into unified record ---
    def test_conflict_types_propagated(self):
        geom = _make_square(700.0, 700.0, 50.0)
        gdf_a = _minimal_gdf("P07", "Ravi Kumar", 300.0, geom)
        gdf_b = _minimal_gdf("M07", "Amit Singh", 900.0, geom)
        match = _match("P07", "M07", 0.95, 0.33, 0.12, 0.64, "REQUIRES_REVIEW",
                       "Ravi Kumar", "Amit Singh", 300.0, 900.0)
        conflict_resp = _conflict_response("P07", ["OWNER_MISMATCH", "AREA_MISMATCH"])

        resp = self._run(gdf_a, gdf_b, _matching_response(match), conflict_resp)

        rec = resp.records[0]
        assert "OWNER_MISMATCH" in rec.conflicts
        assert "AREA_MISMATCH" in rec.conflicts
        assert len(rec.conflict_details) == 2

    # --- Test 8: Traceability — source_record_a / source_record_b present ---
    def test_source_record_traceability(self):
        geom = _make_square(800.0, 800.0, 50.0)
        gdf_a = _minimal_gdf("CADSUR-001", "Kumar", 200.0, geom)
        gdf_b = _minimal_gdf("MUNPROP-001", "Kumar", 200.0, geom)
        match = _match("CADSUR-001", "MUNPROP-001", 0.97, 1.0, 1.0, 0.97, "AUTO_VERIFIED",
                       "Kumar", "Kumar", 200.0, 200.0)
        resp = self._run(gdf_a, gdf_b, _matching_response(match))

        rec = resp.records[0]
        assert rec.source_record_a == "CADSUR-001"
        assert rec.source_record_b == "MUNPROP-001"
        assert rec.parcel_id == "CADSUR-001"


# ---------------------------------------------------------------------------
# Smoke test against Mission 3 synthetic GeoJSON data
# ---------------------------------------------------------------------------

class TestSyntheticDataSmoke:
    """
    Loads the Mission 3 synthetic GeoJSON files and exercises the full pipeline
    to ensure no exceptions are raised and all 7 test cases (A-G) produce records.
    """

    @pytest.fixture(scope="class")
    def sample_data_dir(self):
        p = SYNTHETIC_DATA_DIR
        if not p.exists():
            pytest.skip(f"Synthetic data not found at {p}; skipping smoke test.")
        return p

    def test_cadastral_and_municipal_produce_records(self, sample_data_dir):
        from app.services.crs import normalize_crs
        from app.services.matching import match_datasets
        from app.services.conflicts import detect_dataset_conflicts
        from app.models.matching import MatchingConfig

        cad_path = sample_data_dir / "cadastral.geojson"
        mun_path = sample_data_dir / "municipal.geojson"

        if not cad_path.exists() or not mun_path.exists():
            pytest.skip("cadastral.geojson or municipal.geojson not found.")

        gdf_a = gpd.read_file(str(cad_path))
        gdf_b = gpd.read_file(str(mun_path))

        with open(str(cad_path)) as f:
            raw_a = json.load(f)
        with open(str(mun_path)) as f:
            raw_b = json.load(f)

        gdf_a, _ = normalize_crs(gdf_a, raw_geojson=raw_a)
        gdf_b, _ = normalize_crs(gdf_b, raw_geojson=raw_b)

        matching = match_datasets(gdf_a, gdf_b, config=MatchingConfig())
        conflicts = detect_dataset_conflicts(gdf_a, gdf_b, matching)
        result = generate_unified_records(
            gdf_a=gdf_a,
            gdf_b=gdf_b,
            matching_response=matching,
            conflict_response=conflicts,
        )

        assert result.success is True
        assert result.total_records == len(gdf_a)

        # Every record must be traceable back to cadastral
        for rec in result.records:
            assert rec.source_record_a, "source_record_a must always be set"
            assert rec.geometry_selection_rule is not None
            assert rec.status is not None
            assert isinstance(rec.confidence, float)
            assert 0.0 <= rec.confidence <= 100.0

    def test_api_unify_endpoint(self, sample_data_dir):
        from fastapi.testclient import TestClient
        from app.main import app

        cad_path = sample_data_dir / "cadastral.geojson"
        mun_path = sample_data_dir / "municipal.geojson"

        if not cad_path.exists() or not mun_path.exists():
            pytest.skip("cadastral.geojson or municipal.geojson not found.")

        client = TestClient(app)
        with open(str(cad_path), "rb") as fa, open(str(mun_path), "rb") as fb:
            response = client.post(
                "/unify",
                files={
                    "cadastral": ("cadastral.geojson", fa, "application/geo+json"),
                    "municipal": ("municipal.geojson", fb, "application/geo+json"),
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_records"] > 0
        assert "records" in data

        for record in data["records"]:
            assert "parcel_id" in record
            assert "confidence" in record
            assert "status" in record
            assert record["status"] in ["AUTO_VERIFIED", "REQUIRES_REVIEW", "HUMAN_VERIFIED", "REJECTED"]
            assert "sources" in record
            assert isinstance(record["sources"], list)
            assert "cadastral" in record["sources"]
            assert "conflicts" in record
            assert "source_record_a" in record
            assert "geometry_selection_rule" in record

