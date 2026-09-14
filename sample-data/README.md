# Sample Geospatial Datasets

> **⚠ SYNTHETIC DATA ONLY**
> All three datasets are completely fabricated for the SIH26013 prototype demonstration.
> They do not represent any real government records, actual land parcels, real property ownership,
> or any actual geography. The study area ("Vastu Nagar ward") is fictional.

---

## Files

| File | Records | Description |
|---|---|---|
| `cadastral.geojson` | 29 features | Cadastral/parcel boundaries — schema: `parcel_id`, `owner_name`, `area`, `land_area` (alias), `survey_no`, `geometry` |
| `municipal.geojson` | 28 features | Municipal property records — schema: `property_id`, `holder_name` (→ `owner_name`), `plot_area` (→ `area`), `ward`, `geometry` |
| `buildings.geojson` | 17 features | Drone-derived building footprints — schema: `building_id`, `building_area`, `floors`, `geometry` |

All files use **EPSG:4326 (WGS 84)** and pass GeoPandas geometry validation.

---

## Generator

```
python generate_demo_data.py
```

Fixed seed: **42** — output is 100% deterministic and reproducible offline.

---

## §23 Test Case Index (Mission 5 Tests)

Seven test cases from PROJECT_CONTEXT.md §23 are deliberately embedded and locatable by ID:

| Case | Scenario | Cadastral ID | Municipal ID | Building ID | Expected Outcome |
|---|---|---|---|---|---|
| **A** | Perfect match | P101 | M-101 | B-101 | `AUTO_VERIFIED` ≥ 96% |
| **B** | Name abbreviation ("Priya Sharma" vs "P. Sharma") | P102 | M-102 | — | Match, `AUTO_VERIFIED` |
| **C** | Owner conflict ("Ravi Kumar" vs "Amit Singh") | P103 | M-103 | — | `OWNER_MISMATCH` flagged |
| **D** | Area discrepancy (500 m² vs 603.8 m², ~20.8% diff) | P104 | M-104 | B-102 | `AREA_MISMATCH` flagged |
| **E** | Boundary mismatch (5 m + 4 m offset, partial overlap) | P105 | M-105 | B-103 | `BOUNDARY_MISMATCH` flagged |
| **F** | Missing municipal record (P106 absent from municipal) | P106 | — | B-104 | `MISSING_MUNICIPAL_RECORD` |
| **G** | Low-confidence candidate (shifted + smaller + name divergence) | P107 | M-106 | — | `REQUIRES_REVIEW` < 90% |

Filler parcels **P108–P129** provide realistic volume (normal high-confidence matches).

---

## Deliberate Schema Differences (Tests Schema Normalization)

- Cadastral uses `owner_name` — canonical field.
- Municipal uses `holder_name` — must be mapped → `owner_name`.
- Cadastral uses `area` and `land_area` (redundant alias) — both map to canonical `area`.
- Municipal uses `plot_area` — must be mapped → `area`.

---

## Study Area

Fictional 6-column × 5-row grid ("Vastu Nagar ward"), approximately 150 m × 100 m,
centred near 79.09°E, 21.14°N. All coordinates are invented.
