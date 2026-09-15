# SIH26013 — AI Agent Mission Playbook (v3)

## How this works

Three files, three jobs — none of them duplicate each other:

| File | Job |
|---|---|
| `docs/PROJECT_CONTEXT.md` | The full spec — data model, formulas, JSON contracts, UI mockups, demo script. **The source of truth for "what to build."** |
| `.agent/rules/sih26013-rules.md` | Hard architectural constraints that apply to every mission, always. |
| `mission-playbook.md` (this file) | **The source of truth for "in what order, and exactly what to check off."** Each mission cites the `PROJECT_CONTEXT.md` sections it needs and inlines the specific fields/formulas/endpoints required to implement it — you should not need to re-read the whole context file every mission, but you must read the cited sections before implementing.

**Invocation:** the user says `Execute Mission N`. Before doing anything else:
1. Read `.agent/rules/sih26013-rules.md` in full (it's short — always load it).
2. Read the `Read:` sections cited by this mission from `PROJECT_CONTEXT.md`.
3. Load only the `Skills:` listed for this mission.
4. Then follow the per-mission protocol below.

Do not execute later missions unless a prerequisite is genuinely missing and required to make this mission testable — and say so explicitly before doing it.

## Per-mission protocol

1. **State** the mission being executed.
2. **Inspect** current repo state relevant to this mission (files, configs, schema, routes, README, git status — don't assume anything doesn't exist).
3. **Plan** the exact sub-items in scope.
4. **Implement.**
5. **Test** — actually run it (build/start/curl/click), don't just eyeball the code.
6. **Fix** anything the implementation broke.
7. **Report:**

```
MISSION STATUS
---------------
Mission: <N — name>
Skills used: <list>
Context sections read: <e.g. §5, §6>

Completed:
- ...
Tests run:
- ...
Files changed:
- ...
Known issues:
- ...
Ready for:
- Mission <N+1>
```

---

## MISSION 1 — Project Setup

**Skills:** `backend-architect`, `backend-node-express`, `fastapi`, `frontend-react-js`, `docker-expert`, `database-design`
**Read:** PROJECT_CONTEXT §5 (stack responsibilities), §6 (data model — for foresight only, don't build tables yet)

**Build:**
```
SIH26013/
├── frontend/        React + JS + Tailwind, minimal shell only
├── node-server/      GET /api/health → {"success": true, "service": "node-server"}
├── geo-engine/       GET /health → identifies FastAPI service
├── database/          PostGIS config, not full schema yet
├── sample-data/
├── docs/
├── .gitignore, .env.example, docker-compose.yml, README.md
```
Verify each service actually starts. `.env.example` includes placeholders for: database URL, Node port, FastAPI port, frontend API URL, future API keys.

**Definition of done:** all four services start; both health endpoints return 200; folder structure + `.env.example` + README exist.

---

## MISSION 2 — Database & PostGIS

**Skills:** `database-design`, `design-postgres-tables`, `design-postgis-tables`, `postgresql`
**Read:** PROJECT_CONTEXT §6 (full table field list)

**Build:** `CREATE EXTENSION IF NOT EXISTS postgis;` verified with a real spatial query, not just a syntax check. Create the six tables exactly as specified in §6 (`projects`, `datasets`, `records`, `matches`, `conflicts`, `reviews`) with a GiST spatial index on the geometry column and indexes on foreign keys, `confidence`, and `status`. Write migrations/seed SQL — the schema must be reproducible from code, not hand-created.

**Definition of done:** schema rebuilds from a clean database via migrations; a real `ST_Intersects` or `ST_Area` query returns a correct result against test rows.

---

## MISSION 3 — Synthetic Demo Data

**Skills:** `python-development`
**Read:** PROJECT_CONTEXT §23 (all seven test cases, determinism requirement)

**Build:** one small synthetic study area, clearly documented as synthetic. Three GeoJSON files — `cadastral.geojson`, `municipal.geojson`, `buildings.geojson` — 20–50 parcels, with cases A–G from §23 deliberately present and locatable by ID. Fixed seed if any randomness is used.

**Definition of done:** all seven cases exist in the data and are individually identifiable (know which parcel ID is which case, for demo rehearsal and for Mission 5's tests).

---

## MISSION 4 — FastAPI Ingestion Engine

**Skills:** `fastapi`, `python-development`
**Read:** PROJECT_CONTEXT §7 (schema mapping), §8 (CRS), §9 (geometry validation)

**Build:**
- Ingestion: validate file exists, valid JSON, valid GeoJSON, geometry present, supported geometry type.
- Schema detection using the alias mapping in §7 (`holder_name`/`landholder` → `owner_name`; `plot_area`/`parcel_area`/`land_area` → `area`).
- CRS: detect, normalize to one common **projected** CRS; unresolvable CRS → `CRS_REVIEW_REQUIRED`, never guessed.
- Geometry validation + safe repair, tracking repair status per record.
- Response contract:
```json
{
  "success": true,
  "records_processed": 42,
  "crs": "...",
  "geometry_types": ["Polygon"],
  "schema_mapping": {},
  "validation": { "valid": 40, "repaired": 1, "invalid": 1 }
}
```

**Definition of done:** all three Mission 3 datasets go upload → read → normalize → validate → structured response, verified end to end.

---

## MISSION 5 — Spatial & Attribute Matching Engine

**Skills:** `python-development`, `fastapi`, `testing-qa`
**Read:** PROJECT_CONTEXT §10 (formula + worked example, threshold)

**Build:** candidate generation via bounding box/spatial index before scoring (don't brute-force compare every pair). Compute `spatial_score` (IoU or a documented equivalent), `area_score` (`1 - abs(a-b)/max(a,b)`, clamped, missing handled explicitly), `attribute_score` (fuzzy name matching). Combine via the §10 formula with configurable weights (default 50/20/30). Threshold 0.90 (config value) → `AUTO_VERIFIED` / `REQUIRES_REVIEW`. Return the explanation payload (`spatial_score`, `area_score`, `attribute_score`, `confidence`) — never just the final number. Unit tests covering: exact match, name abbreviation, area mismatch, spatial mismatch, low-confidence case, missing attributes.

**Definition of done:** running the matcher against Mission 3's data reproduces the expected outcome for every one of the seven cases, every run.

---

## MISSION 6 — Conflict Detection Engine

**Skills:** `python-development`, `fastapi`
**Read:** PROJECT_CONTEXT §12 (conflict types + object shape)

**Build:** owner conflict (name-format variance vs. genuinely different name), area conflict (absolute + percentage, configurable tolerance), boundary conflict (geometry overlap/difference), missing-record detection (either direction). Severity: LOW/MEDIUM/HIGH with documented thresholds. Output shape: `{"type": "...", "severity": "...", "description": "..."}`.

**Definition of done:** conflicts generate correctly and reliably against the Mission 3 test cases.

---

## MISSION 7 — Unified Record Generation

**Skills:** `python-development`, `database-design`
**Read:** PROJECT_CONTEXT §13 (unified record JSON, both clean and problematic examples)

**Build:** produce the unified record shape from §13 for every match. Track `sources` (flat array is acceptable for MVP; per-field provenance is a stretch goal). Document the geometry-selection rule used (e.g. prefer drone footprint above a confidence threshold, else cadastral) — never pick arbitrarily or silently. Status values: `AUTO_VERIFIED`, `REQUIRES_REVIEW`, `HUMAN_VERIFIED`, `REJECTED`.

**Definition of done:** every match produces a unified record traceable back to its exact source records.

---

## MISSION 8 — Node/Express Application API

**Skills:** `backend-node-express`, `api-design`, `security-audit`
**Read:** PROJECT_CONTEXT §5 (traffic direction: React→Node→FastAPI only)

**Build:**
```
GET  /api/health
POST /api/projects            GET /api/projects            GET /api/projects/:id
POST /api/projects/:id/datasets            GET /api/projects/:id/datasets
POST /api/projects/:id/process
GET  /api/projects/:id/results             GET /api/projects/:id/conflicts            GET /api/projects/:id/map
POST /api/reviews/:id/decision   (body: ACCEPT | REJECT | RESOLVE, optional comment)
```
Only implement endpoints the UI actually needs. Define one shared JS response contract used by both frontend and backend — don't let either side invent its own shape (example contract in PROJECT_CONTEXT §16's dashboard numbers is representative of the summary shape expected).

**Definition of done:** full path verified with real requests — HTTP → Node → FastAPI → database → Node response.

---

## MISSION 9 — Frontend Application Shell

**Skills:** `frontend-react-js`
**Read:** PROJECT_CONTEXT §17 (upload/processing/results screens), §18 (nav shape)

**Build:** six pages — Dashboard, Datasets, Processing, Unified Map, Records, Review — with the navigation shape from §18. Dashboard pulls real metrics (§16) once the API exists. Datasets page shows name/source/CRS/record count/status. Upload UI has one control per dataset type with real status/error/success states (§17).

**Definition of done:** a user can navigate all six pages and upload all three datasets without touching the backend directly.

---

## MISSION 10 — Leaflet GIS Map

**Skills:** `leaflet`, `frontend-react-js`
**Read:** PROJECT_CONTEXT §14 (layers, click-interaction mockups for both clean and problem records)

**Build:** base map with tile provider config separated from app logic. Toggleable layers: Unified / Cadastral / Municipal / Buildings. Click a parcel → detail panel matching the two mockups in §14 exactly (fields: Parcel ID, Owner, Area, Building, Confidence, Status, Sources, Conflicts). Problem parcels visually distinct by more than color alone. Zoom/pan/fit-bounds/focus-on-selection all functional.

**Note (rules.md):** GeoJSON is `[lng, lat]`, Leaflet is `[lat, lng]` — reorder explicitly wherever geometry crosses this boundary.

**Definition of done:** map renders real processed data (not placeholder geometry); clicking both a clean and a problem parcel shows the correct mockup.

---

## MISSION 11 — Results Table & Map Sync

**Skills:** `frontend-react-js`
**Read:** PROJECT_CONTEXT §15 (columns, search, filters, sync requirement)

**Build:** table with the exact columns from §15. Search by parcel/property/owner/building ID. Filters: All / Verified / Requires Review / Conflicts / Missing Data, plus confidence-range filter. Row click focuses the map feature; map feature click updates table selection where practical.

**Definition of done:** a user can fully inspect the unified dataset via the table alone, and table/map stay in sync.

---

## MISSION 12 — Human-in-the-Loop Review

**Skills:** `frontend-react-js`, `backend-node-express`, `api-design`
**Read:** PROJECT_CONTEXT §11 (full comparison mockup + actions + status transition)

**Build:** review queue showing only `REQUIRES_REVIEW` records. Side-by-side source comparison matching §11's mockup exactly, including the three component scores. Actions Accept/Reject/Resolve persist reviewer, decision, comment, timestamp, and transition status (`REQUIRES_REVIEW → HUMAN_VERIFIED` or `→ REJECTED`). Map and table both reflect the new status after a decision without a full reload if avoidable.

**Definition of done:** a judge can see why a record is uncertain, decide, and immediately see that decision reflected everywhere in the app.

---

## MISSION 13 — End-to-End Integration

**Skills:** `e2e-testing-patterns`, `testing-qa`, `backend-architect`
**Read:** PROJECT_CONTEXT §3 (full pipeline diagram), §25 (definition of done checklist)

**Build:** the complete flow in §3, with all UI-only mocks replaced by real API results. Handle: Node unavailable, FastAPI unavailable, DB error, invalid file, processing error — each with a real, specific error message (not a blank screen). Real loading states, real empty states ("No datasets uploaded", "No conflicts found", "No records require review"). After any review decision, table/dashboard/map/queue all stay consistent.

**Definition of done:** every item in PROJECT_CONTEXT §25 is achievable through the browser alone, with no manual DB edits or backend calls.

---

## MISSION 14 — UI Polish

**Skills:** `frontend-react-js`, `ponytail`
**Read:** PROJECT_CONTEXT §18 (nav/design tone)

**Build:** polish, in order: dashboard → upload → processing visualization → map + side panel → records table → review screen → responsive behavior at laptop/tablet widths. Professional, clean, information-dense but readable, restrained, map-centric. Avoid excessive animation, gradients, unnecessary 3D, gaming-style UI, over-rounded cards, and decoration with no informational purpose.

Use `ponytail` for a simplification pass once each screen already works — trimming, not adding.

---

## MISSION 15 — Export & Provenance (should-have, only if time permits)
9 
**Skills:** `backend-node-express`, `python-development`
**Read:** PROJECT_CONTEXT §13 (provenance note)

**Build:** "Download Unified GeoJSON" export; optional CSV export of the results table; show source provenance in the UI where already tracked. Do not let this consume time Missions 1–13 still need.

---

## MISSION 16 — Optional AI Assistance (only after all must-haves work)

**Skills:** `rules`
**Read:** PROJECT_CONTEXT §19 (both use cases + hard rule)

**Build:** schema-mapping suggestions and plain-language conflict explanations exactly as scoped in §19 — both are human-reviewable suggestions layered on top of already-computed deterministic values, never a replacement for them.

**Hard rule:** the LLM never computes or modifies geometry, coordinates, area, spatial similarity, or confidence.

---

## MISSION 17 — Demo Hardening

**Skills:** `testing-qa`, `e2e-testing-patterns`, `security-audit`
**Read:** PROJECT_CONTEXT §23 (determinism), rules.md (security section)

**Build:** confirm all four services start reliably from a clean checkout; a predictable DB reset/seed mechanism; demo datasets reloadable repeatedly without breaking state; same input twice → same output; deliberately test bad GeoJSON, empty file, missing geometry, missing CRS, invalid geometry, backend-unavailable; walk the full browser flow manually once; confirm processing time is reasonable for prototype-sized data (do not chase performance beyond that).

---

## MISSION 18 — Final Presentation Mode

**Skills:** `ponytail`, `get-shit-done`
**Read:** PROJECT_CONTEXT §22 (full timed demo script), §21 (closing line)

**Build:** rehearse the exact script in §22 against the actual running app. Use `get-shit-done` to ruthlessly cut anything not required for those 2 minutes to run flawlessly. Use `ponytail` for a final simplification pass on anything visible along that specific path.

---

## MISSION 19 — Final Audit

**Skills:** `security-audit`, `testing-qa`, `rules`, `ponytail`
**Read:** rules.md in full, PROJECT_CONTEXT §5 (architecture), §20 (what we don't claim)

**Build:** confirm, one by one: architecture chain intact (no swaps); original/normalized/unified data all present and traceable; synthetic data labeled everywhere; CRS/geometry/matching/conflict logic verified against real runs, not assumed; human review queue/comparison/decision/persistence/state-update all verified; frontend has no dead buttons; errors/loading/empty states all real; no secrets committed, uploads validated, filenames sanitized, env vars used throughout.

---

## MISSION 20 — README & Technical Documentation

**Skills:** `get-shit-done`
**Read:** PROJECT_CONTEXT §1–§4, §20, §24 (problem, philosophy, non-claims, future scope)

**Build:** README covering project title, SIH problem ID, problem + solution explanation, architecture, tech stack, folder structure, setup instructions, env variables, running instructions, dataset format, matching algorithm, confidence calculation, human-in-the-loop workflow, screenshots if available, demo flow, limitations, future scope, and the explicit line: *"This is a prototype using synthetic demonstration datasets."*

---

## Hard "do not" list (applies to every mission — also see rules.md)

Never: rebuild the whole stack because it's easier; add Kafka/Kubernetes/Celery/RabbitMQ/Redis/GraphQL/Elasticsearch/a vector database without explicit user request; swap PostgreSQL/PostGIS, FastAPI, or Node/Express; remove Leaflet; build production auth; connect to a real or imagined government API; fabricate government data; let an LLM compute spatial values; hide uncertainty or auto-accept every match; overwrite source data; work on §24 future-scope before the Mission 1–13 core is fully working; fake a loading indicator.

## Emergency priority order (if time runs out mid-build)

1. End-to-end working flow (Missions 1–8, 13)
2. Geospatial processing (4, 5, 6, 7)
3. Human review (12)
4. Interactive map (10)
5. Results table (11)
6. UI polish (14)
7. Optional AI (16)
8. Future-scope (24) — last, and only if everything above is solid

Stop wherever time runs out. Do not skip ahead to a later, flashier item at the cost of an earlier one still being broken.



python -m uvicorn app.main:app --app-dir geo-engine --host 127.0.0.1 --port 8000 --reload