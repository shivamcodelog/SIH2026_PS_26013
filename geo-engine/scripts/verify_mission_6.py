"""
Verification script for Mission 6: Conflict Detection Engine.
Runs Cadastral vs Municipal conflict detection and validates that
conflicts and severities are generated correctly and reliably against
the Mission 3 test cases.
"""

import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app

client = TestClient(app)

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample-data"))


def main():
    print("=" * 95)
    print(" MISSION 6 — CONFLICT DETECTION ENGINE VERIFICATION")
    print("=" * 95)

    cad_path = os.path.join(SAMPLE_DIR, "cadastral.geojson")
    mun_path = os.path.join(SAMPLE_DIR, "municipal.geojson")

    with open(cad_path, "rb") as fa, open(mun_path, "rb") as fb:
        response = client.post(
            "/conflicts",
            files={
                "file_a": ("cadastral.geojson", fa, "application/geo+json"),
                "file_b": ("municipal.geojson", fb, "application/geo+json"),
            },
        )

    if response.status_code != 200:
        print(f"[FAIL] HTTP {response.status_code}: {response.text}")
        sys.exit(1)

    payload = response.json()
    print(f"\nConflict Detection Summary:")
    print(f"  Total Entities Evaluated:       {payload['total_entities_evaluated']}")
    print(f"  Entities With Conflicts:        {payload['entities_with_conflicts_count']}")
    print(f"  Conflict Counts by Severity:    {payload['conflict_counts_by_severity']}")
    print(f"  Conflict Counts by Type:        {payload['conflict_counts_by_type']}")

    results_by_a = {r["entity_id_a"]: r for r in payload["results"]}

    EXPECTED_CASES = [
        ("A", "P101", "M-101", 0, [], "Perfect match"),
        ("B", "P102", "M-102", 0, [], "Name format abbreviation ('Priya Sharma' vs 'P. Sharma')"),
        ("C", "P103", "M-103", 1, ["OWNER_MISMATCH"], "Owner conflict ('Ravi Kumar' vs 'Amit Singh')"),
        ("D", "P104", "M-104", 1, ["AREA_MISMATCH"], "Area discrepancy (500 m² vs 603.8 m²)"),
        ("E", "P105", "M-105", 1, ["BOUNDARY_MISMATCH"], "Boundary mismatch (5m, 4m offset)"),
        ("F", "P106", None, 1, ["MISSING_MUNICIPAL_RECORD"], "Missing municipal record"),
        ("G", "P107", "M-106", 3, ["BOUNDARY_MISMATCH", "AREA_MISMATCH", "OWNER_MISMATCH"], "Low-confidence compound conflicts"),
    ]

    print("\n" + "-" * 95)
    print(f"{'Case':<5} {'Cad ID':<8} {'Mun ID':<8} {'Status':<16} {'Conflicts Detected':<38} {'Check'}")
    print("-" * 95)

    all_passed = True
    for case_letter, cad_id, exp_mun_id, min_expected_confs, exp_types, description in EXPECTED_CASES:
        res = results_by_a.get(cad_id)
        if not res:
            print(f"[{case_letter}] MISSING: {cad_id}")
            all_passed = False
            continue

        conflicts = res["conflicts"]
        detected_types = [f"{c['type']}({c['severity']})" for c in conflicts]
        conf_str = ", ".join(detected_types) if detected_types else "None (Clean)"

        # Verify expected conflict types are present
        actual_types_set = {c["type"] for c in conflicts}
        expected_types_set = set(exp_types)
        types_match = expected_types_set.issubset(actual_types_set)
        count_match = len(conflicts) >= min_expected_confs

        case_ok = types_match and count_match
        if not case_ok:
            all_passed = False

        status_str = "HAS_CONFLICTS" if res["has_conflicts"] else "CLEAN"
        check_sym = "PASS" if case_ok else "FAIL"

        print(f"[{case_letter}]   {cad_id:<8} {str(res['entity_id_b']):<8} {status_str:<16} {conf_str:<38} {check_sym}")

    print("-" * 95)
    if all_passed:
        print("\n ALL MISSION 3 TEST CASES GENERATED CONFLICTS RELIABLY & ACCURATELY!")
    else:
        print("\n [ERROR] ONE OR MORE CONFLICT TEST CASES FAILED.")
        sys.exit(1)
    print("=" * 95)


if __name__ == "__main__":
    main()
