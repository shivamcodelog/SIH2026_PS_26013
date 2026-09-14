import os
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SAMPLE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded", "online"]


def test_ingest_cadastral():
    file_path = os.path.join(SAMPLE_DATA_DIR, "cadastral.geojson")
    with open(file_path, "rb") as f:
        response = client.post(
            "/ingest",
            files={"file": ("cadastral.geojson", f, "application/geo+json")},
        )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["records_processed"] == 29
    assert data["crs"] == "EPSG:32643"
    assert "Polygon" in data["geometry_types"]
    assert data["schema_mapping"].get("land_area") == "area"
    assert data["schema_mapping"].get("owner_name") == "owner_name"
    assert data["validation"]["valid"] == 29
    assert data["validation"]["repaired"] == 0
    assert data["validation"]["invalid"] == 0


def test_ingest_municipal():
    file_path = os.path.join(SAMPLE_DATA_DIR, "municipal.geojson")
    with open(file_path, "rb") as f:
        response = client.post(
            "/ingest",
            files={"file": ("municipal.geojson", f, "application/geo+json")},
        )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["records_processed"] == 28
    assert data["crs"] == "EPSG:32643"
    assert "Polygon" in data["geometry_types"]
    # Verify §7 alias mappings
    assert data["schema_mapping"].get("holder_name") == "owner_name"
    assert data["schema_mapping"].get("plot_area") == "area"
    assert data["schema_mapping"].get("property_id") == "parcel_id"
    assert data["validation"]["valid"] == 28
    assert data["validation"]["repaired"] == 0
    assert data["validation"]["invalid"] == 0


def test_ingest_buildings():
    file_path = os.path.join(SAMPLE_DATA_DIR, "buildings.geojson")
    with open(file_path, "rb") as f:
        response = client.post(
            "/ingest",
            files={"file": ("buildings.geojson", f, "application/geo+json")},
        )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["records_processed"] == 17
    assert data["crs"] == "EPSG:32643"
    assert "Polygon" in data["geometry_types"]
    # Verify §7 alias mappings
    assert data["schema_mapping"].get("building_id") == "parcel_id"
    assert data["schema_mapping"].get("building_area") == "area"
    assert data["validation"]["valid"] == 17
    assert data["validation"]["repaired"] == 0
    assert data["validation"]["invalid"] == 0


def test_ingest_missing_crs_flags_review():
    """When CRS cannot be determined from file or metadata, flag CRS_REVIEW_REQUIRED, never guess."""
    geojson_no_crs = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"parcel_id": "P999", "owner_name": "Test Owner", "area": 500.0},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [[79.088, 21.145], [79.089, 21.145], [79.089, 21.146], [79.088, 21.146], [79.088, 21.145]]
                    ],
                },
            }
        ],
    }
    raw_bytes = json.dumps(geojson_no_crs).encode("utf-8")
    response = client.post(
        "/ingest",
        files={"file": ("nocrs.geojson", raw_bytes, "application/geo+json")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["crs"] == "CRS_REVIEW_REQUIRED"
    assert data["records_processed"] == 1


def test_ingest_invalid_geometry_repair():
    """Self-intersecting bowtie polygon should be safely repaired."""
    bowtie_geojson = {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::4326"}},
        "features": [
            {
                "type": "Feature",
                "properties": {"parcel_id": "P_BOWTIE", "owner_name": "Self Intersect", "area": 100.0},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [[0.0, 0.0], [0.0, 2.0], [2.0, 0.0], [2.0, 2.0], [0.0, 0.0]]
                    ],
                },
            }
        ],
    }
    raw_bytes = json.dumps(bowtie_geojson).encode("utf-8")
    response = client.post(
        "/ingest",
        files={"file": ("bowtie.geojson", raw_bytes, "application/geo+json")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["validation"]["repaired"] == 1
    assert data["validation"]["valid"] == 0
    assert data["validation"]["invalid"] == 0


def test_ingest_malformed_json():
    """Invalid JSON syntax returns HTTP 400."""
    response = client.post(
        "/ingest",
        files={"file": ("corrupt.geojson", b"not a valid json {{{{", "application/geo+json")},
    )
    assert response.status_code == 400
    assert "Invalid JSON" in response.json()["detail"]


def test_ingest_invalid_geojson_root():
    """JSON that is not a FeatureCollection returns HTTP 400."""
    raw_bytes = json.dumps({"foo": "bar"}).encode("utf-8")
    response = client.post(
        "/ingest",
        files={"file": ("not_geojson.json", raw_bytes, "application/json")},
    )
    assert response.status_code == 400
    assert "Unsupported or missing GeoJSON type" in response.json()["detail"]


def test_ingest_unsupported_extension():
    """Non-geojson/json extension returns HTTP 400."""
    response = client.post(
        "/ingest",
        files={"file": ("table.csv", b"a,b,c\n1,2,3", "text/csv")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]
