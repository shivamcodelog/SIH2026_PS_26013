"""
Verification script for Mission 5: Spatial & Attribute Matching Engine.
Matches Cadastral vs Municipal records and verifies the expected outcome
for all seven test cases (A-G) from PROJECT_CONTEXT §23 / Mission 3.
"""

import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app

client = TestClient(app)

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))


def main():
    print("=" * 85)
    print(" MISSION 5 — SPATIAL & ATTRIBUTE MATCHING ENGINE VERIFICATION")
    print("=" * 85)

    cad_path = os.path.join(SAMPLE_DIR, "cadastral.geojson")
    mun_path = os.path.join(SAMPLE_DIR, "municipal.geojson")

    with open(cad_path, "rb") as fa, open(mun_path, "rb") as fb:
        response = client.post(
            "/match",
            files={
                "file_a": ("cadastral.geojson", fa, "application/geo+json"),
                "file_b": ("municipal.geojson", fb, "application/geo+json"),
            },
        )

    if response.status_code != 200:
        print(f"[FAIL] HTTP {response.status_code}: {response.text}")
        sys.exit(1)

    payload = response.json()
    print(f"\nMatching Summary:")
    print(f"  Total Cadastral:   {payload['total_records_a']}")
    print(f"  Total Municipal:   {payload['total_records_b']}")
    print(f"  AUTO_VERIFIED:     {payload['auto_verified_count']}")
    print(f"  REQUIRES_REVIEW:   {payload['requires_review_count']}")
    print(f"  UNMATCHED:         {payload['unmatched_a_count']}")

    matches_by_a = {m["source_record_a"]: m for m in payload["matches"]}

    EXPECTED_CASES = [
        ("A", "P101", "M-101", "AUTO_VERIFIED", "Perfect match"),
        ("B", "P102", "M-102", "AUTO_VERIFIED", "Name abbreviation ('Priya Sharma' vs 'P. Sharma')"),
        ("C", "P103", "M-103", "REQUIRES_REVIEW", "Owner conflict ('Ravi Kumar' vs 'Amit Singh')"),
        ("D", "P104", "M-104", "REQUIRES_REVIEW", "Area discrepancy (500 m² vs 603.8 m²)"),
        ("E", "P105", "M-105", "REQUIRES_REVIEW", "Boundary mismatch (5m, 4m offset)"),
        ("F", "P106", None, "UNMATCHED", "Missing municipal record"),
        ("G", "P107", "M-106", "REQUIRES_REVIEW", "Low-confidence candidate (shifted + smaller)"),
    ]

    print("\n" + "-" * 85)
    print(f"{'Case':<5} {'Cad ID':<8} {'Mun ID':<8} {'Spatial':<9} {'Area':<8} {'Attr':<8} {'Conf':<8} {'Status':<16} {'Check'}")
    print("-" * 85)

    all_cases_ok = True
    for case_letter, cad_id, exp_mun_id, exp_status, description in EXPECTED_CASES:
        m = matches_by_a.get(cad_id)
        if not m:
            print(f"[{case_letter}] MISSING: {cad_id}")
            all_cases_ok = False
            continue

        mun_id = m.get("source_record_b") or "None"
        spatial = f"{m['spatial_score']:.3f}"
        area = f"{m['area_score']:.3f}"
        attr = f"{m['attribute_score']:.3f}"
        conf = f"{m['confidence'] * 100:.1f}%"
        status = m["status"]

        id_matches = (exp_mun_id is None and m.get("source_record_b") is None) or (m.get("source_record_b") == exp_mun_id)
        status_matches = (status == exp_status)
        is_ok = id_matches and status_matches

        if not is_ok:
            all_cases_ok = False

        check_sym = "PASS" if is_ok else "FAIL"
        print(f"[{case_letter}]   {cad_id:<8} {mun_id:<8} {spatial:<9} {area:<8} {attr:<8} {conf:<8} {status:<16} {check_sym} ({description})")

    print("-" * 85)
    if all_cases_ok:
        print("\n ALL SEVEN MISSION 3 TEST CASES REPRODUCED EXPECTED OUTCOMES DETERMINISTICALLY!")
    else:
        print("\n [ERROR] ONE OR MORE TEST CASES DID NOT MATCH EXPECTED OUTCOMES.")
        sys.exit(1)
    print("=" * 85)


if __name__ == "__main__":
    main()
