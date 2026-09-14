#!/usr/bin/env python3
"""
==============================================================================
SIH26013 - Python PostGIS Verification & Migration Runner
Compliant with: mission-playbook.md (MISSION 2 — Database & PostGIS)
==============================================================================
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from dotenv import load_dotenv

# Load root .env
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env")

# Connection credentials
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5433"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "sih26013_landrecords")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

def get_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        connect_timeout=5
    )

def run_verification():
    print("=" * 70)
    print("SIH26013 - MISSION 2: PostGIS & Database Schema Verification")
    print("=" * 70)
    print(f"[*] Target Database: postgresql://{POSTGRES_USER}:****@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

    conn = get_connection()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1. PostGIS Extension Verification
        print("\n[Step 1] Verifying PostGIS Extension...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
        cur.execute("SELECT PostGIS_Full_Version();")
        v = cur.fetchone()
        print(f"  [+] PostGIS installed: {v['postgis_full_version']}")

        # 2. Run Migration 001_initial_schema.sql
        print("\n[Step 2] Executing 001_initial_schema.sql...")
        migration_path = Path(__file__).parent / "migrations" / "001_initial_schema.sql"
        with open(migration_path, "r", encoding="utf-8") as f:
            cur.execute(f.read())
        print("  [+] Schema migration applied cleanly.")

        # 3. Verify Table Creation
        print("\n[Step 3] Verifying 6 Core Tables from PROJECT_CONTEXT §6...")
        expected_tables = ["projects", "datasets", "records", "matches", "conflicts", "reviews"]
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = ANY(%s);
        """, (expected_tables,))
        found_tables = {row["table_name"] for row in cur.fetchall()}
        for tbl in expected_tables:
            if tbl in found_tables:
                print(f"  [+] Table '{tbl}': FOUND")
            else:
                raise RuntimeError(f"Missing required table: '{tbl}'")

        # 4. Verify Spatial GiST Index & Relational Indexes
        print("\n[Step 4] Verifying GiST Spatial Index & Foreign Key Indexes...")
        cur.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'records' AND indexname = 'idx_records_geometry';
        """)
        gist_idx = cur.fetchone()
        if not gist_idx or "GIST" not in gist_idx["indexdef"].upper():
            raise RuntimeError("GiST spatial index idx_records_geometry not found on records table!")
        print(f"  [+] Spatial GiST Index: {gist_idx['indexname']} ({gist_idx['indexdef']})")

        expected_indexes = [
            "idx_datasets_project_id",
            "idx_records_dataset_id",
            "idx_matches_project_id",
            "idx_matches_confidence",
            "idx_matches_status",
            "idx_conflicts_match_id",
            "idx_conflicts_resolved",
            "idx_reviews_match_id"
        ]
        cur.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname = ANY(%s);
        """, (expected_indexes,))
        found_indexes = {row["indexname"] for row in cur.fetchall()}
        for idx in expected_indexes:
            assert idx in found_indexes, f"Missing expected index: {idx}"
            print(f"  [+] Index '{idx}': VERIFIED")

        # 5. Run Seed 001_sample_data.sql
        print("\n[Step 5] Seeding Reproducible Spatial Test Rows...")
        seed_path = Path(__file__).parent / "seeds" / "001_sample_data.sql"
        with open(seed_path, "r", encoding="utf-8") as f:
            cur.execute(f.read())
        print("  [+] Seed data inserted.")

        # 6. Execute Real PostGIS Spatial Queries (ST_Area & ST_Intersects)
        print("\n[Step 6] Executing Real PostGIS Spatial Queries...")
        cur.execute("""
            SELECT 
                r1.parcel_id AS parcel_a,
                r2.parcel_id AS parcel_b,
                r1.source_record_id AS src_a,
                r2.source_record_id AS src_b,
                ST_Intersects(r1.geometry, r2.geometry) AS intersects,
                ROUND(ST_Area(r1.geometry::geography)::numeric, 2) AS area_a_sqm,
                ROUND(ST_Area(r2.geometry::geography)::numeric, 2) AS area_b_sqm,
                ROUND(ST_Area(ST_Intersection(r1.geometry, r2.geometry)::geography)::numeric, 2) AS overlap_area_sqm,
                ROUND((
                    ST_Area(ST_Intersection(r1.geometry, r2.geometry)::geography) / 
                    ST_Area(ST_Union(r1.geometry, r2.geometry)::geography)
                )::numeric, 4) AS iou_score
            FROM records r1, records r2
            WHERE r1.source_record_id = 'CAD_PARCEL_101' 
              AND r2.source_record_id = 'MUNI_REC_4402';
        """)
        overlap_test = cur.fetchone()
        assert overlap_test is not None, "Overlap query returned no rows!"
        assert overlap_test["intersects"] is True, "ST_Intersects should return True for overlapping parcels!"
        assert overlap_test["area_a_sqm"] > 10000, "Calculated ST_Area should be ~14,200 sq m"

        print(f"  [+] Overlap Test: {overlap_test['src_a']} vs {overlap_test['src_b']}")
        print(f"      - ST_Intersects: {overlap_test['intersects']}")
        print(f"      - Geodesic Area A (ST_Area): {overlap_test['area_a_sqm']} m²")
        print(f"      - Geodesic Area B (ST_Area): {overlap_test['area_b_sqm']} m²")
        print(f"      - Intersecting Area (ST_Intersection): {overlap_test['overlap_area_sqm']} m²")
        print(f"      - Calculated Spatial IoU Overlap Score: {overlap_test['iou_score']}")

        # Disjoint test
        cur.execute("""
            SELECT 
                r1.parcel_id AS parcel_a,
                r3.parcel_id AS parcel_c,
                ST_Intersects(r1.geometry, r3.geometry) AS intersects,
                ROUND(ST_Distance(r1.geometry::geography, r3.geometry::geography)::numeric, 2) AS distance_m
            FROM records r1, records r3
            WHERE r1.source_record_id = 'CAD_PARCEL_101' 
              AND r3.source_record_id = 'CAD_PARCEL_102';
        """)
        disjoint_test = cur.fetchone()
        assert disjoint_test["intersects"] is False, "ST_Intersects should return False for non-overlapping parcels!"
        print(f"  [+] Disjoint Test: {disjoint_test['parcel_a']} vs {disjoint_test['parcel_c']}")
        print(f"      - ST_Intersects: {disjoint_test['intersects']} (Correctly Disjoint)")
        print(f"      - Geodesic Separation (ST_Distance): {disjoint_test['distance_m']} meters")

        # 7. Summary counts
        print("\n[Step 7] Validating Entity Row Counts...")
        cur.execute("""
            SELECT 
                (SELECT count(*) FROM projects) as projects,
                (SELECT count(*) FROM datasets) as datasets,
                (SELECT count(*) FROM records) as records,
                (SELECT count(*) FROM matches) as matches,
                (SELECT count(*) FROM conflicts) as conflicts,
                (SELECT count(*) FROM reviews) as reviews;
        """)
        counts = cur.fetchone()
        for k, v in counts.items():
            print(f"  [+] {k.capitalize()}: {v} row(s)")

        print("\n" + "=" * 70)
        print(">>> MISSION 2 DEFINITION OF DONE: 100% SATISFIED <<<")
        print("Schema rebuilds cleanly from migrations.")
        print("Real ST_Intersects & ST_Area queries returned verified results.")
        print("=" * 70)

    except Exception as e:
        print(f"\n[!] Verification Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_verification()
