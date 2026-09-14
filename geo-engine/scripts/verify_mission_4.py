"""
Verification script for Mission 4: FastAPI Ingestion Engine.
Demonstrates end-to-end ingestion, schema detection, CRS normalization,
and geometry validation/repair for all 3 Mission 3 datasets.
"""

import os
import sys
import json
from fastapi.testclient import TestClient

# Add geo-engine to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app

client = TestClient(app)

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))
DATASETS = ["cadastral.geojson", "municipal.geojson", "buildings.geojson"]


def main():
    print("=" * 70)
    print(" MISSION 4 — FASTAPI INGESTION ENGINE END-TO-END VERIFICATION")
    print("=" * 70)

    all_passed = True

    for filename in DATASETS:
        file_path = os.path.join(SAMPLE_DIR, filename)
        if not os.path.exists(file_path):
            print(f"[ERROR] File not found: {file_path}")
            all_passed = False
            continue

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        response = client.post(
            "/ingest",
            files={"file": (filename, file_bytes, "application/geo+json")},
        )

        if response.status_code != 200:
            print(f"[FAIL] {filename} HTTP {response.status_code}: {response.text}")
            all_passed = False
            continue

        payload = response.json()
        print(f"\n[OK] Dataset: {filename}")
        print(f"  Records Processed: {payload['records_processed']}")
        print(f"  Normalized CRS:   {payload['crs']}")
        print(f"  Geometry Types:   {payload['geometry_types']}")
        print(f"  Schema Mappings:  {json.dumps(payload['schema_mapping'])}")
        print(f"  Validation:       Valid={payload['validation']['valid']}, Repaired={payload['validation']['repaired']}, Invalid={payload['validation']['invalid']}")

        # Validate contract keys
        expected_keys = {"success", "records_processed", "crs", "geometry_types", "schema_mapping", "validation"}
        if not expected_keys.issubset(payload.keys()):
            print(f"  [WARN] Missing keys: {expected_keys - set(payload.keys())}")
            all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print(" ALL THREE MISSION 3 DATASETS SUCCESSFULLY INGESTED & VERIFIED!")
    else:
        print(" SOME DATASETS FAILED VERIFICATION.")
    print("=" * 70)


if __name__ == "__main__":
    main()
