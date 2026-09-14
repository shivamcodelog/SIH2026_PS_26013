# SIH26013 — Intelligent Geospatial Data Harmonization Platform

## 0. DOCUMENT PURPOSE

This document is the **single source of truth** for building the SIH26013 prototype.

Any AI coding assistant, agent, or developer working on this project must use this document as the primary context.

The objective is to build a **working prototype for Smart India Hackathon 2026 college-level Round 1**, not a production-ready government GIS platform.

The prototype must demonstrate the core idea clearly:

> **Take heterogeneous geospatial datasets from different sources, automatically normalize and harmonize them, match records representing the same real-world land/property entities, detect inconsistencies, calculate confidence, send uncertain cases to a human for verification, and present the resulting unified information on an interactive WebGIS map and structured data interface.**

The prototype must prioritize:

1. Working functionality
2. Clear demonstration of the SIH problem
3. Strong visual presentation
4. Simple architecture
5. Fast development
6. Explainability
7. Reliability of the demo

Do NOT introduce unnecessary enterprise infrastructure.

---

# 1. SIH PROBLEM

## Problem ID

SIH26013

## Problem

Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management.

## Core Problem

Urban land information is distributed across multiple sources.

Examples include:

* cadastral/parcel maps
* municipal property records
* drone survey data
* building footprints
* revenue land records
* utility databases
* GNSS/CORS survey information
* ORI imagery
* DSM/DTM datasets

These datasets may describe the same real-world land parcels or buildings but can differ in:

* file format
* coordinate reference system
* schema
* field names
* identifiers
* geometry
* boundaries
* area
* ownership attributes
* update dates
* data quality
* completeness

Traditionally, GIS experts may need to manually clean, transform, align and compare these datasets.

This is slow and error-prone.

Our prototype demonstrates an automated system that performs much of this work.

---

# 2. WHAT WE ARE ACTUALLY BUILDING

We are building a **web-based intelligent geospatial data harmonization platform**.

The user/official opens the website.

They can upload multiple datasets representing the same geographic area.

For the prototype, we will focus on THREE representative datasets:

### Dataset 1 — Cadastral / Parcel Dataset

Example fields:

* parcel_id
* owner_name
* area
* geometry

### Dataset 2 — Municipal Property Dataset

Example fields:

* property_id
* holder_name
* plot_area
* geometry

### Dataset 3 — Drone Building Footprint Dataset

Example fields:

* building_id
* building_area
* geometry

The system processes these datasets.

It performs:

1. File ingestion
2. Schema detection
3. Schema normalization
4. Coordinate reference system detection/normalization
5. Geometry validation
6. Geometry repair where possible
7. Attribute similarity matching
8. Spatial matching
9. Area comparison
10. Conflict detection
11. Confidence calculation
12. Human review for uncertain records
13. Unified record generation
14. Interactive map visualization

---

# 3. THE MAIN USER JOURNEY

The entire application should follow this flow:

```text
USER / OFFICIAL
       |
       v
WEB APPLICATION
       |
       v
UPLOAD DATASETS
       |
       v
DATA INGESTION
       |
       v
SCHEMA NORMALIZATION
       |
       v
CRS NORMALIZATION
       |
       v
GEOMETRY VALIDATION
       |
       v
SPATIAL + ATTRIBUTE MATCHING
       |
       v
CONFLICT DETECTION
       |
       v
CONFIDENCE SCORING
       |
       +----------------------+
       |                      |
       | >= 90%               | < 90%
       v                      v
AUTO ACCEPT             HUMAN REVIEW
       |                      |
       +----------+-----------+
                  |
                  v
          UNIFIED RECORD
                  |
          +-------+-------+
          |               |
          v               v
     DATA TABLE       INTERACTIVE MAP
```

---

# 4. PROTOTYPE PHILOSOPHY

This is NOT a complete implementation of every feature mentioned in the SIH problem statement.

The SIH statement describes a much larger real-world system.

Our prototype will demonstrate the **core technical concept using a smaller representative dataset**.

We should explicitly communicate:

> "The prototype demonstrates the core harmonization pipeline using cadastral, municipal and drone-derived datasets. The architecture is designed to extend to revenue, utility, GNSS/CORS, ORI and DSM/DTM datasets."

Do not pretend that we implemented every possible government data source.

---

# 5. TECHNOLOGY STACK

## Frontend

### React

Used for:

* application UI
* dashboard
* dataset upload interface
* results tables
* review interface
* map page

### JavaScript

Use JavaScript throughout the frontend.

### Tailwind CSS

Used for UI styling.

### Leaflet

Used for the interactive GIS map.

Leaflet is responsible for:

* displaying map tiles
* displaying parcel polygons
* displaying building polygons
* displaying markers
* clicking geographic features
* popups
* layer toggling
* zooming/panning
* highlighting selected features

Leaflet is NOT responsible for geospatial computation.

---

# 6. BACKEND ARCHITECTURE

There are TWO backend services.

This separation is intentional.

---

## Backend 1 — Node.js + Express

This is the **application backend**.

Responsibilities:

* REST API
* project management
* dataset upload handling
* dataset metadata
* request validation
* communicating with FastAPI
* retrieving results
* serving application-level APIs

Node/Express should NOT perform complex geospatial processing.

---

## Backend 2 — Python + FastAPI

This is the **geospatial processing engine**.

Responsibilities:

* reading geospatial files
* detecting/handling schemas
* CRS transformation
* geometry validation
* geometry repair
* spatial matching
* attribute matching
* area comparison
* conflict detection
* confidence scoring
* generating unified geospatial results

Python is used because the geospatial ecosystem is significantly stronger for this task.

---

# 7. PYTHON GEOSPATIAL STACK

## GeoPandas

Used for:

* reading GeoJSON
* reading Shapefiles/other supported formats where practical
* manipulating geospatial tables
* coordinate reference systems
* spatial joins
* geospatial dataframe operations

## Shapely

Used for:

* geometry validation
* intersection
* containment
* distance
* area
* overlap
* geometry repair where appropriate

Important operations include concepts equivalent to:

```text
intersects
contains
within
distance
intersection
area
validity
```

## PyProj

Used for:

* CRS handling
* coordinate transformation

Example:

```text
EPSG:4326
      ↓
projected CRS appropriate for analysis
```

Distance and area calculations must preferably use an appropriate projected CRS rather than blindly calculating metric quantities in geographic latitude/longitude coordinates.

---

# 8. DATABASE

## PostgreSQL + PostGIS

PostgreSQL is the primary database.

PostGIS adds geospatial capabilities.

The database should store:

* projects
* datasets
* dataset metadata
* normalized records
* geometries
* matches
* conflicts
* confidence scores
* review decisions

PostGIS should be used for spatial queries where appropriate.

Examples of useful spatial concepts:

```text
ST_Intersects
ST_Contains
ST_Within
ST_Distance
ST_Area
ST_Intersection
ST_Transform
```

Do not duplicate complex spatial logic unnecessarily between the database and Python.

For the prototype, Python can perform most processing while PostGIS acts as the persistent geospatial database.

---

# 9. DO NOT ADD THESE TECHNOLOGIES UNLESS ABSOLUTELY NECESSARY

Do NOT introduce:

* Kafka
* Kubernetes
* Celery
* RabbitMQ
* microservice explosion
* complex event-driven architecture
* distributed systems
* Redis
* Elasticsearch
* vector databases
* GraphQL
* complicated authentication systems

These are unnecessary for the Round-1 prototype.

Docker/Docker Compose is optional and useful for reproducibility.

---

# 10. HIGH-LEVEL SYSTEM ARCHITECTURE

```text
                         USER / OFFICIAL
                                |
                                v
                    +----------------------+
                    |      REACT APP       |
                    | JavaScript + Tailwind|
                    |      + Leaflet       |
                    +----------+-----------+
                               |
                         REST API
                               |
                               v
                    +----------------------+
                    |   NODE + EXPRESS     |
                    |  Application Server  |
                    +----------+-----------+
                               |
                         HTTP / REST
                               |
                               v
                    +----------------------+
                    |      FASTAPI         |
                    | Geospatial Engine    |
                    +----------+-----------+
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
       GeoPandas           Shapely            PyProj
             |                 |                 |
             +-----------------+-----------------+
                               |
                               v
                    +----------------------+
                    | PostgreSQL + PostGIS |
                    | Geospatial Database  |
                    +----------+-----------+
                               |
                               v
                    Unified Geospatial Data
                               |
                  +------------+------------+
                  |                         |
                  v                         v
             Data/Table View          Leaflet Map
                  |                         |
                  +------------+------------+
                               |
                               v
                         Human Review
```

---

# 11. LOW-LEVEL DATA PROCESSING PIPELINE

The processing engine should conceptually follow this sequence.

## STEP 1 — INGESTION

Receive uploaded datasets.

Example:

```text
cadastral.geojson
municipal.geojson
buildings.geojson
```

Validate:

* file exists
* supported format
* readable
* contains geometry
* contains usable attributes

---

# 12. STEP 2 — SCHEMA DETECTION

Different datasets may use different names for the same concept.

Example:

```text
Cadastral:
owner_name

Municipal:
holder_name

Revenue:
landholder

```

The system should map these into canonical fields.

Canonical schema:

```text
owner_name
area
parcel_id
geometry
```

Example mapping:

```text
owner_name  → owner_name
holder_name → owner_name
landholder  → owner_name
```

Similarly:

```text
area
plot_area
parcel_area
land_area
```

can map to:

```text
area
```

The prototype may use a combination of:

* known mapping rules
* string similarity
* fuzzy matching

An LLM may optionally assist schema mapping, but the system must not depend on an LLM for basic functionality.

---

# 13. STEP 3 — CRS NORMALIZATION

Different datasets may use different coordinate reference systems.

Example:

```text
Dataset A → EPSG:4326
Dataset B → EPSG:32643
Dataset C → another CRS
```

The system should transform datasets into a common CRS.

Conceptually:

```text
SOURCE CRS
     ↓
CRS DETECTION
     ↓
COMMON CRS
```

The normalized CRS should be stored in dataset metadata.

Never silently assume a CRS when it is known from the source metadata.

If a CRS is genuinely missing, the application should flag it rather than inventing one.

---

# 14. STEP 4 — GEOMETRY VALIDATION

Check:

* missing geometries
* invalid geometries
* empty geometries
* malformed polygons
* duplicate geometries where detectable
* geometry type consistency

Where safely possible, attempt geometry repair.

Example:

```text
Invalid Polygon
       ↓
Repair
       ↓
Valid Polygon
```

If repair fails:

```text
Geometry Error
       ↓
Flag for Review
```

Never silently discard problematic records.

---

# 15. STEP 5 — SPATIAL MATCHING

The same real-world parcel may have different IDs in different systems.

Therefore, IDs alone cannot be trusted.

Example:

```text
Cadastral:
Parcel ID = P101

Municipal:
Property ID = M-782

Drone:
Building ID = B21
```

The system determines whether these objects spatially correspond.

Potential signals:

### Spatial overlap

How much geometry overlaps?

### Distance

How close are geometries?

### Area similarity

How similar are reported areas?

### Attribute similarity

How similar are names/attributes?

---

# 16. MATCHING SCORE

The prototype can use an explainable weighted score.

Example:

```text
Overall Confidence =
    50% Spatial Similarity
  + 20% Area Similarity
  + 30% Attribute Similarity
```

This is a prototype design and the weights can be tuned using sample data.

Example:

```text
Spatial similarity = 0.96
Area similarity    = 0.90
Attribute similarity = 0.93

Confidence =
0.50(0.96)
+ 0.20(0.90)
+ 0.30(0.93)

= 0.939
= 93.9%
```

The UI should explain the score rather than presenting it as mysterious "AI magic".

---

# 17. CONFIDENCE THRESHOLD

Primary threshold:

```text
90%
```

### >= 90%

Automatically accepted as a high-confidence match.

Example:

```text
96% → Automatically matched
```

### < 90%

Send to human review.

Example:

```text
82% → Requires verification
```

The threshold should be configurable in code/configuration rather than hardcoded throughout the application.

---

# 18. HUMAN-IN-THE-LOOP

This is a major feature.

The system must NOT pretend that automation is perfect.

When confidence is below the threshold:

```text
MATCH DETECTED
       ↓
Confidence = 82%
       ↓
REQUIRES HUMAN REVIEW
```

The official should see:

```text
Cadastral Record

Owner: Amit Singh
Area: 310 m²

Municipal Record

Owner: Amit Kumar
Area: 334 m²

Spatial overlap: 91%
Area similarity: 86%
Name similarity: 73%

Overall confidence: 82%
```

Actions:

```text
[ Accept Match ]
[ Reject Match ]
[ Edit / Resolve ]
```

After acceptance:

```text
status = HUMAN_VERIFIED
```

The system should retain the original source values.

Do not overwrite source records destructively.

---

# 19. CONFLICT DETECTION

The system should detect meaningful conflicts.

Examples:

## Owner conflict

```text
Cadastral owner:
Ravi Kumar

Municipal owner:
Ravi K.

→ likely same person
```

versus:

```text
Cadastral:
Ravi Kumar

Municipal:
Amit Singh

→ conflict
```

## Area conflict

Example:

```text
Cadastral: 246 m²
Municipal: 262 m²
```

Flag if difference exceeds configured tolerance.

## Boundary conflict

Example:

Two parcel geometries represent the same area but boundaries differ.

Calculate appropriate spatial difference/overlap measures.

## Missing data

Example:

```text
Parcel exists in cadastral dataset
but no corresponding municipal record.
```

Flag:

```text
MISSING_MUNICIPAL_RECORD
```

---

# 20. UNIFIED RECORD

After harmonization, the system should create a unified representation.

Example:

```json
{
  "parcel_id": "P101",
  "owner_name": "Ravi Kumar",
  "area": 246,
  "building_id": "B21",
  "confidence": 96,
  "status": "AUTO_VERIFIED",
  "sources": [
    "cadastral",
    "municipal",
    "drone"
  ],
  "conflicts": []
}
```

For a problematic record:

```json
{
  "parcel_id": "P102",
  "owner_name": null,
  "confidence": 82,
  "status": "REQUIRES_REVIEW",
  "sources": [
    "cadastral",
    "municipal"
  ],
  "conflicts": [
    "OWNER_MISMATCH",
    "AREA_MISMATCH"
  ]
}
```

---

# 21. INTERACTIVE MAP

The map is a CORE part of the prototype.

Do NOT make the application only a table-based data integration system.

Use Leaflet in the React frontend.

The map should show:

* parcel boundaries
* building footprints
* unified records
* conflicts
* selected entities

---

# 22. MAP LAYERS

The map should support layer toggling.

Example:

```text
Layers

☑ Unified Parcels
☑ Cadastral
☑ Municipal
☑ Drone Buildings
```

Potential future layers:

```text
☐ Revenue
☐ Utilities
☐ GNSS/CORS
☐ Imagery
```

The future layers do not need to be implemented in the prototype.

---

# 23. MAP INTERACTION

When the user clicks a parcel:

Open a side panel or popup.

Example:

```text
PARCEL P101
────────────────────

Owner
Ravi Kumar

Area
246 m²

Building
B21

Sources
✓ Cadastral
✓ Municipal
✓ Drone

Confidence
96%

Status
AUTO VERIFIED

Conflicts
None
```

For an uncertain parcel:

```text
PARCEL P102
────────────────────

Confidence
82%

Status
REQUIRES REVIEW

⚠ Owner mismatch
⚠ Area mismatch

[Review Record]
```

---

# 24. VISUALIZING CONFLICTS

The map should make problematic areas visually obvious.

Example concept:

```text
Normal parcel
    ↓
Unified/normal visualization

Problematic parcel
    ↓
Highlighted visualization
    ↓
Click
    ↓
Conflict details
```

The exact colors/design are a UI decision, but the semantic distinction must be obvious.

Do not rely only on color; include labels/icons/status where appropriate.

---

# 25. DATA TABLE

The application should also contain a structured result table.

Columns:

```text
Parcel ID
Owner
Area
Building
Sources
Confidence
Status
Conflicts
Action
```

Example:

```text
P101 | Ravi Kumar | 246m² | B21 | 3 | 96% | Verified | None | View
P102 | —          | 310m² | B22 | 2 | 82% | Review   | 2    | Review
P103 | Amit Singh | 412m² | B25 | 3 | 94% | Verified | None | View
```

Clicking a table row should ideally focus/select the corresponding map feature.

---

# 26. DASHBOARD

The application should have a simple dashboard.

Example metrics:

```text
Datasets
3

Records Processed
1,245

Matched
1,102

Conflicts
43

Human Review
17

High Confidence
89%
```

These numbers should come from actual processing results.

Do NOT hardcode fake dashboard statistics after the system is functional.

---

# 27. DATASET UPLOAD SCREEN

The user should be able to upload datasets.

Example UI:

```text
Upload Geospatial Data

┌─────────────────────────────┐
│ Cadastral Dataset           │
│ [ Upload File ]             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Municipal Dataset           │
│ [ Upload File ]             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Drone Building Dataset      │
│ [ Upload File ]             │
└─────────────────────────────┘

             [ Process Data ]
```

Supported formats for the prototype should preferably include:

* GeoJSON

Additional formats can be added if time permits.

Do NOT spend excessive time implementing every GIS format.

---

# 28. PROCESSING SCREEN

After upload:

```text
Processing Dataset...

✓ Reading datasets
✓ Detecting schema
✓ Normalizing fields
✓ Normalizing CRS
✓ Validating geometry
✓ Matching records
✓ Detecting conflicts
✓ Calculating confidence

Processing complete.
```

The progress UI should reflect real backend stages where practical.

Do not fake progress if it is difficult to synchronize.

A simple processing state is acceptable.

---

# 29. RESULT SCREEN

After processing, show:

```text
Harmonization Complete

1,245 records processed
1,102 matches found
43 conflicts
17 require human review

[ View Unified Map ]
[ View All Records ]
[ Review Conflicts ]
```

---

# 30. HUMAN REVIEW SCREEN

Show only uncertain/conflicting records.

Example:

```text
Records Requiring Review

P102
Confidence: 82%
Owner mismatch
Area mismatch

[ Review ]

P147
Confidence: 76%
Boundary mismatch

[ Review ]
```

Clicking Review opens the comparison.

---

# 31. SOURCE COMPARISON

For a selected record, show the source information side-by-side.

Example:

```text
                 P102

CADASTRAL              MUNICIPAL
─────────────────      ─────────────────
Owner                   Owner
Amit Singh              Amit Kumar

Area                    Area
310 m²                  334 m²

Geometry                Geometry
Polygon A               Polygon B
```

Then:

```text
Spatial Similarity: 91%
Area Similarity: 86%
Attribute Similarity: 73%

Overall Confidence: 82%
```

Actions:

```text
[ ACCEPT ]
[ REJECT ]
[ RESOLVE ]
```

This is an important demo feature.

---

# 32. OPTIONAL AI COMPONENT

AI should NOT be used everywhere simply because the problem statement contains the word AI.

The core system can work using:

* spatial algorithms
* fuzzy string matching
* deterministic rules
* statistical confidence scoring

Optional AI can be used for:

### Schema mapping

Example:

```text
"holder_nm"
"owner_name"
"landholder"
```

AI can suggest:

```text
→ owner_name
```

### Conflict explanation

Example:

```text
"Why is this record flagged?"
```

AI could generate:

> "The cadastral and municipal records likely represent the same parcel because their geometries overlap by 91%, but the owner names differ substantially and the reported areas differ by approximately 7.7%."

The explanation should be based on actual computed values.

Never allow an LLM to invent spatial facts.

---

# 33. AI SAFETY RULE

LLMs are NOT authoritative for:

* geometry
* coordinates
* area
* distances
* spatial relationships
* record IDs
* government records

Those must come from actual data and algorithms.

LLMs may explain or assist with mappings, but not fabricate underlying geospatial facts.

---

# 34. DATA MODEL

Basic database entities:

```text
Project
Dataset
Record
Match
Conflict
Review
```

---

## Project

Example:

```text
id
name
description
created_at
```

---

## Dataset

Example:

```text
id
project_id
name
source_type
file_name
file_format
crs
uploaded_at
status
```

---

## Record

Example:

```text
id
dataset_id
source_record_id
parcel_id
owner_name
area
geometry
normalized_attributes
```

---

## Match

Example:

```text
id
project_id
source_record_a
source_record_b
spatial_score
area_score
attribute_score
confidence
status
```

---

## Conflict

Example:

```text
id
match_id
type
severity
description
resolved
```

---

## Review

Example:

```text
id
match_id
reviewer
decision
comment
created_at
```

---

# 35. SOURCE DATA PRESERVATION

Never destroy original source values.

The system should maintain:

```text
Original source data
        +
Normalized representation
        +
Unified representation
```

This is important because government data harmonization requires traceability.

---

# 36. DATA PROVENANCE

Every unified record should ideally indicate where information came from.

Example:

```text
Owner:
Municipal + Cadastral

Area:
Cadastral

Building:
Drone

Geometry:
Unified from Cadastral + Municipal
```

For the prototype, a simple `sources` field is sufficient.

---

# 37. VERSIONED DATA REPOSITORY — FUTURE FEATURE

The idea of a GitHub-like geospatial data repository is interesting but NOT part of the core Round-1 implementation.

Future concept:

```text
Geospatial Data Repository

Project
   |
   +-- Dataset
   |
   +-- Version 1
   +-- Version 2
   +-- Version 3
```

Possible capabilities:

* public datasets
* private datasets
* organization-level access
* dataset versions
* change history
* publishing
* rollback
* audit trail

For the prototype, this can be shown under:

```text
Future Scope
```

Do NOT spend core development time building this unless the primary prototype is already complete.

---

# 38. MANUAL MAP EDITING — FUTURE FEATURE

Potential future feature:

An authorized official could:

* draw a parcel
* edit a boundary
* add a building
* correct an attribute
* split/merge geometry

This is NOT necessary for the first prototype.

The current human-in-the-loop requirement can be satisfied through record review and accept/reject/resolve actions.

---

# 39. AUTHENTICATION

Authentication is not the primary objective.

If time is limited:

Use a simple demo user or minimal authentication.

Do not spend hours implementing:

* OAuth
* complex RBAC
* government SSO
* enterprise identity systems

If implemented, basic roles could be:

```text
Admin
Official
Viewer
```

But authentication must not delay the core geospatial pipeline.

---

# 40. PROJECT STRUCTURE

Recommended structure:

```text
SIH26013/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── map/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── node-server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── app.js
│   │
│   └── package.json
│
├── geo-engine/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ingestion.py
│   │   │   ├── schema.py
│   │   │   ├── crs.py
│   │   │   ├── geometry.py
│   │   │   ├── matching.py
│   │   │   ├── conflicts.py
│   │   │   └── confidence.py
│   │   └── models/
│   │
│   └── requirements.txt
│
├── database/
│   ├── migrations/
│   └── seed.sql
│
├── sample-data/
│   ├── cadastral.geojson
│   ├── municipal.geojson
│   └── buildings.geojson
│
├── docker-compose.yml
│
└── README.md
```

The exact structure can change if there is a compelling reason, but responsibilities must remain clear.

---

# 41. API ARCHITECTURE

## Node API

Example:

```text
POST /api/projects
GET  /api/projects
GET  /api/projects/:id

POST /api/projects/:id/datasets
GET  /api/projects/:id/datasets

POST /api/projects/:id/process

GET /api/projects/:id/results
GET /api/projects/:id/conflicts
GET /api/projects/:id/map

POST /api/reviews/:id/decision
```

These are conceptual endpoints.

Do not blindly implement every endpoint if the UI does not need it.

---

# 42. FASTAPI API

Example:

```text
POST /process
POST /validate
POST /match
POST /harmonize
GET  /health
```

The exact API can be simplified.

The FastAPI service is an internal processing engine.

The frontend should generally communicate with Node/Express rather than directly calling the Python service.

Architecture:

```text
React
  ↓
Node
  ↓
FastAPI
```

Not:

```text
React
 ↓       ↘
Node    FastAPI
```

unless there is a specific reason.

---

# 43. API CONTRACT PRINCIPLE

Before implementing frontend integration, define the expected JSON response.

Example:

```json
{
  "success": true,
  "project_id": "project-001",
  "summary": {
    "datasets": 3,
    "records_processed": 1245,
    "matches": 1102,
    "conflicts": 43,
    "requires_review": 17
  },
  "records": []
}
```

Frontend and backend must follow the same contract.

Do not allow different components to invent incompatible response structures.

---

# 44. SAMPLE DATA

We should create synthetic but realistic GeoJSON data for the prototype.

IMPORTANT:

Do NOT use fabricated government records and present them as real government data.

Clearly label demo data:

```text
Synthetic Demo Dataset
```

Create perhaps:

```text
20–100 parcels
```

rather than thousands initially.

Include intentionally imperfect data.

---

# 45. SAMPLE DATA MUST DEMONSTRATE THE PROBLEM

The sample datasets should NOT all match perfectly.

Create scenarios such as:

### Case 1 — Perfect match

```text
Spatial: high
Area: similar
Name: similar

Confidence: 96%
```

### Case 2 — Attribute variation

```text
Ravi Kumar
Ravi K.
```

Should likely match.

### Case 3 — Owner conflict

```text
Ravi Kumar
Amit Singh
```

Should be flagged.

### Case 4 — Area discrepancy

```text
246 m²
268 m²
```

Should be flagged depending on tolerance.

### Case 5 — Boundary mismatch

Two geometries represent roughly the same parcel but boundaries differ.

### Case 6 — Missing record

Parcel exists in one dataset but not another.

### Case 7 — Low-confidence match

A candidate match exists but confidence <90%.

This makes the demonstration dramatically better.

---

# 46. DEMO DATA SHOULD BE DETERMINISTIC

The demo must produce predictable results.

Do not depend on:

* random data
* external APIs
* live government servers
* unreliable internet services
* external AI APIs for core processing

The demo should work offline after setup where practical.

---

# 47. MAP DATA

The final map should receive GeoJSON or an equivalent serializable geographic representation.

Example:

```text
FastAPI
   ↓
Unified GeoJSON
   ↓
Node API
   ↓
React
   ↓
Leaflet
```

The frontend should not perform the main spatial calculations.

---

# 48. WHAT THE FINAL APPLICATION SHOULD LOOK LIKE

The application should feel like a professional government GIS dashboard.

Suggested navigation:

```text
┌──────────────────────────────────────────────┐
│ LANDHARMONIZE / PROJECT NAME                 │
├──────────────┬───────────────────────────────┤
│ Dashboard    │                               │
│ Datasets     │                               │
│ Processing   │       MAIN CONTENT             │
│ Unified Map  │                               │
│ Records      │                               │
│ Review       │                               │
└──────────────┴───────────────────────────────┘
```

Do not overdesign.

Focus on clarity.

---

# 49. CORE PAGES

## Page 1 — Dashboard

Show:

* project
* datasets
* processing summary
* conflicts
* reviews

## Page 2 — Datasets

Show:

* uploaded datasets
* source
* CRS
* record count
* status

## Page 3 — Processing

Show:

* pipeline stages
* processing status

## Page 4 — Unified Map

Show:

* interactive map
* layers
* parcel/building information

## Page 5 — Records

Show:

* unified records table
* filtering
* confidence
* status

## Page 6 — Human Review

Show:

* conflicts
* source comparison
* decision controls

---

# 50. SEARCH AND FILTERING

Useful prototype features:

Search by:

```text
Parcel ID
Owner
Property ID
Building ID
```

Filter by:

```text
All
Verified
Requires Review
Conflicts
Missing Data
```

Filter by confidence:

```text
<90%
90–95%
>95%
```

These are relatively cheap features with high demo value.

---

# 51. MAP ↔ TABLE SYNCHRONIZATION

This should be implemented if possible.

Example:

User clicks:

```text
P102
```

on table.

Map automatically:

```text
zoom → P102
highlight → P102
open details
```

Similarly:

User clicks P102 on map.

Table can select P102.

This makes the application feel like a real GIS system rather than two disconnected screens.

---

# 52. EXPLAINABILITY

Every confidence score should ideally be explainable.

Instead of:

```text
Confidence: 82%
```

show:

```text
Confidence: 82%

Spatial similarity      91%
Area similarity         86%
Attribute similarity    73%
```

This is much better for judges.

---

# 53. PROCESSING LOG

A small technical log can show:

```text
[✓] Loaded cadastral dataset
[✓] Loaded municipal dataset
[✓] Loaded drone dataset
[✓] Normalized schemas
[✓] CRS normalized
[✓] Validated 87 geometries
[✓] Found 64 spatial matches
[!] Found 7 conflicts
[!] 3 records require human review
[✓] Generated unified dataset
```

This demonstrates that the system actually performs a pipeline.

---

# 54. WHAT WE ARE NOT CLAIMING

The prototype should NOT claim:

* legal ownership determination
* authoritative land title verification
* production-grade government deployment
* perfect matching
* legal cadastral finalization
* guaranteed AI accuracy
* nationwide scalability
* real-time integration with all government systems
* actual government database access unless legitimately provided

The system is a prototype demonstrating automated data harmonization.

---

# 55. WHAT WE WANT TO SHOW TO THE JUDGES

The most important story:

### Before

```text
Cadastral       Municipal       Drone
    |               |              |
    v               v              v

Different formats
Different schemas
Different IDs
Different geometries
Different areas
```

### Our system

```text
       MULTI-SOURCE DATA
               |
               v
      AUTOMATED HARMONIZATION
               |
     +---------+---------+
     |         |         |
     v         v         v
   Schema     CRS     Geometry
   Mapping  Normalize Validation
     |         |         |
     +---------+---------+
               |
               v
      SPATIAL + ATTRIBUTE
           MATCHING
               |
               v
       CONFLICT DETECTION
               |
               v
        CONFIDENCE SCORE
          /           \
       HIGH           LOW
        |              |
     AUTO        HUMAN REVIEW
     VERIFY            |
        |              |
        +------+-------+
               |
               v
        UNIFIED LAND DATA
               |
         +-----+-----+
         |           |
         v           v
       TABLE       WEBGIS
                     MAP
```

---

# 56. THE CORE DEMO

The ideal 2-minute demonstration:

## 0:00–0:20

Explain:

> "Urban land information is distributed across multiple datasets. The same parcel may have different IDs, names, boundaries and areas."

## 0:20–0:35

Upload:

```text
Cadastral
Municipal
Drone
```

## 0:35–0:50

Click:

```text
Process
```

Show:

```text
Schema normalization
CRS normalization
Geometry validation
Spatial matching
Conflict detection
```

## 0:50–1:10

Show:

```text
Unified Map
```

Click a parcel.

Show:

```text
Owner
Area
Building
Sources
Confidence
```

## 1:10–1:30

Select a problematic parcel.

Show:

```text
82% confidence
Owner mismatch
Area mismatch
```

## 1:30–1:45

Human reviews it.

```text
Accept / Reject / Resolve
```

## 1:45–2:00

Return to map.

Explain:

> "The result is a harmonized geospatial representation with traceable source information, automated high-confidence matches, and human verification for uncertain cases."

---

# 57. IMPLEMENTATION ORDER

DO NOT build everything simultaneously.

Build in this order.

---

## PHASE 1 — PROJECT SETUP

Create:

```text
frontend
node-server
geo-engine
database
sample-data
```

Set up:

* React + JavaScript
* Node + Express
* Python + FastAPI
* PostgreSQL + PostGIS
* Git

Verify every service starts.

---

# PHASE 2 — DATABASE

Create:

* projects
* datasets
* records
* matches
* conflicts
* reviews

Get PostgreSQL/PostGIS working.

Do not over-engineer.

---

# PHASE 3 — SAMPLE DATA

Create:

```text
cadastral.geojson
municipal.geojson
buildings.geojson
```

Make the datasets intentionally imperfect.

Test that GeoPandas can read them.

---

# PHASE 4 — FASTAPI GEO ENGINE

First implement:

```text
upload/read
    ↓
schema normalization
    ↓
CRS normalization
    ↓
geometry validation
```

Test independently.

---

# PHASE 5 — MATCHING ENGINE

Implement:

```text
spatial similarity
area similarity
attribute similarity
confidence score
```

Test with known sample cases.

Example expected result:

```text
P101 → 96%
P102 → 82%
P103 → 94%
```

---

# PHASE 6 — CONFLICT ENGINE

Implement:

```text
owner mismatch
area mismatch
boundary mismatch
missing record
```

Return structured conflict objects.

---

# PHASE 7 — NODE API

Connect Node to FastAPI.

Architecture:

```text
React
 ↓
Node
 ↓
FastAPI
 ↓
Geo processing
 ↓
PostGIS
```

Test the entire backend flow before building the polished frontend.

---

# PHASE 8 — BASIC FRONTEND

Build:

1. Dashboard
2. Upload
3. Processing
4. Results

Do not spend time on visual polish yet.

---

# PHASE 9 — LEAFLET MAP

Add:

* base map
* parcel polygons
* building polygons
* unified layer
* click interaction
* layer control
* selected feature

---

# PHASE 10 — HUMAN REVIEW

Build:

```text
Review list
     ↓
Record comparison
     ↓
Accept
Reject
Resolve
```

Persist decision.

---

# PHASE 11 — TABLE ↔ MAP

Connect:

```text
Table row
    ↕
Map feature
```

---

# PHASE 12 — UI POLISH

Only after functionality works.

Improve:

* spacing
* typography
* cards
* navigation
* loading states
* error states
* map panel
* confidence visualization

---

# PHASE 13 — DEMO HARDENING

Test the complete flow repeatedly:

```text
Start system
↓
Create project
↓
Upload 3 datasets
↓
Process
↓
See results
↓
Open map
↓
Click parcel
↓
Open conflict
↓
Human review
↓
Accept
↓
Updated result
```

The entire demo must be deterministic.

---

# 58. MVP PRIORITY

Features are divided into three levels.

## MUST HAVE

These must work.

* React UI
* Node/Express API
* FastAPI
* PostgreSQL/PostGIS
* GeoJSON upload
* Schema normalization
* CRS normalization
* Geometry validation
* Spatial matching
* Attribute matching
* Confidence scoring
* Conflict detection
* Human review
* Unified records
* Leaflet map
* Parcel click
* Data table
* Synthetic demo data

---

## SHOULD HAVE

Implement if time permits.

* Search
* Filters
* Map/table synchronization
* Layer toggling
* Processing logs
* Dataset metadata
* Provenance display
* Better geometry conflict visualization
* Export unified GeoJSON

---

## NICE TO HAVE

Only after everything else works.

* LLM-assisted schema mapping
* LLM conflict explanation
* authentication
* role-based access
* dataset versioning
* map editing
* public/private repository
* multiple GIS file formats
* advanced analytics
* real-time synchronization

---

# 59. CRITICAL SCOPE RULE

If a feature does not directly improve the core demo:

```text
Upload
→ Harmonize
→ Match
→ Detect
→ Review
→ Unified Map
```

do not prioritize it.

The objective is a strong working prototype, not maximum feature count.

---

# 60. ERROR HANDLING

The application must handle:

* unsupported file
* malformed GeoJSON
* missing geometry
* invalid CRS
* empty dataset
* invalid geometry
* duplicate records
* processing failure
* backend unavailable

Never show a blank screen.

Show understandable errors.

Example:

```text
Unable to process dataset.

Reason:
The uploaded file does not contain a valid geometry column.

Please upload a valid GeoJSON dataset.
```

---

# 61. LOADING STATES

Never make the user wonder whether the system is frozen.

During processing show:

```text
Processing...

✓ Dataset ingestion
✓ Schema normalization
→ Spatial matching
○ Conflict detection
○ Confidence scoring
```

---

# 62. SECURITY PRINCIPLES

For prototype:

* validate uploads
* limit file size
* sanitize filenames
* do not execute uploaded files
* do not expose database credentials
* use environment variables
* do not commit secrets
* do not hardcode API keys

Use:

```text
.env
```

and provide:

```text
.env.example
```

---

# 63. CONFIGURATION

Thresholds should be configurable.

Example:

```text
MATCH_CONFIDENCE_THRESHOLD=0.90
AREA_TOLERANCE=...
```

Do not scatter magic numbers throughout the code.

---

# 64. CODE QUALITY RULES FOR AI CODING AGENTS

AI coding agents must:

1. Read the existing project structure before creating files.
2. Do not overwrite working code unnecessarily.
3. Do not introduce new libraries without justification.
4. Reuse existing utilities.
5. Keep Node and FastAPI responsibilities separate.
6. Keep geospatial logic inside the Python service.
7. Keep UI logic inside React.
8. Use JavaScript types for API responses.
9. Handle errors explicitly.
10. Avoid fake data in production logic.
11. Use synthetic data only where clearly marked as demo data.
12. Never invent government APIs or government datasets.
13. Never invent coordinates or geographic facts.
14. Never silently change database schemas.
15. Explain major architectural changes before making them.
16. Test each backend stage before integrating the next stage.

---

# 65. ANTI-HALLUCINATION RULE FOR AI CODING

If the coding AI does not know something:

It must NOT invent it.

Instead:

```text
1. Inspect the existing code.
2. Inspect configuration.
3. Inspect database schema.
4. Inspect API contracts.
5. Ask for clarification if the information is genuinely unavailable.
```

Never assume:

* endpoint names
* database columns
* government APIs
* file formats
* CRS
* credentials
* environment variables
* existing components

unless they are defined in the project.

---

# 66. IMPORTANT ARCHITECTURAL RULE

Do not allow architecture drift.

The intended architecture is:

```text
React
  ↓
Node / Express
  ↓
FastAPI
  ↓
Python Geospatial Engine
  ↓
PostgreSQL + PostGIS
```

The frontend should not directly implement complex geospatial processing.

Node should not become the geospatial engine.

FastAPI should not become the main application/business API.

PostGIS should remain the geospatial database.

Leaflet should remain the map visualization layer.

---

# 67. DEFINITION OF DONE

The prototype is considered complete when a user can perform the following from the browser:

```text
1. Open application
2. Create/select project
3. Upload cadastral dataset
4. Upload municipal dataset
5. Upload drone building dataset
6. Start processing
7. See processing status
8. See normalized data
9. See matched records
10. See confidence scores
11. See conflicts
12. Open unified map
13. Click a parcel
14. View unified information
15. Open low-confidence record
16. Compare source records
17. Accept/reject/resolve record
18. See updated status
19. Filter/search records
20. Demonstrate complete workflow without manual code intervention
```

---

# 68. FINAL EXPECTED PRODUCT

At the end of the build, we should have a working website that feels approximately like:

```text
                    LAND HARMONIZATION PLATFORM

Dashboard | Datasets | Unified Map | Records | Review
────────────────────────────────────────────────────────

Datasets:
3

Records:
1,245

Matched:
1,102

Conflicts:
43

Requires Review:
17


                UNIFIED GIS MAP

        ┌──────────────────────────────┐
        │                              │
        │       Parcel P101             │
        │          ┌──────┐             │
        │          │ B21  │             │
        │          └──────┘             │
        │                              │
        │       Parcel P102 ⚠           │
        │                              │
        └──────────────────────────────┘

Selected Parcel
────────────────────────
P101

Owner: Ravi Kumar
Area: 246 m²
Building: B21

Confidence: 96%
Status: Auto Verified

Sources:
✓ Cadastral
✓ Municipal
✓ Drone

Conflicts:
None
```

---

# 69. CORE VALUE PROPOSITION

The prototype should communicate this single sentence:

> **"We transform fragmented and inconsistent geospatial datasets into a unified, validated and confidence-scored land information layer, while keeping humans in the loop for uncertain cases."**

---

# 70. FUTURE EXPANSION

Once the MVP works, the architecture can expand to:

```text
Cadastral
Municipal
Revenue
Utilities
Drone
GNSS/CORS
ORI
DSM/DTM
Satellite imagery
        ↓
Unified Geospatial Platform
```

Future capabilities:

* automated dataset synchronization
* advanced GeoAI
* computer vision
* satellite/drone imagery analysis
* change detection
* automated topology correction
* government department integrations
* role-based access
* audit trails
* dataset versioning
* public/private geospatial repository
* map editing
* collaborative GIS
* large-scale cloud deployment

These are **future scope**, not MVP requirements.

---

# 71. FINAL DEVELOPMENT PRINCIPLE

Build the smallest system that convincingly proves the SIH concept.

Do not attempt to build the entire national land-record infrastructure.

The prototype's strongest story is:

```text
MESSY MULTI-SOURCE DATA
          ↓
AUTOMATED HARMONIZATION
          ↓
SPATIAL + ATTRIBUTE MATCHING
          ↓
CONFLICT DETECTION
          ↓
CONFIDENCE SCORE
          ↓
HUMAN VERIFICATION
          ↓
UNIFIED LAND RECORD
          ↓
INTERACTIVE WEBGIS MAP
```

Everything in the prototype should support this story.

If a proposed feature does not strengthen this pipeline, it should be considered lower priority.



## more brief context

# SIH26013 — Project Context

This is the canonical spec. Mission files reference sections of this document instead of duplicating them — if this file changes, missions stay correct automatically. Read the referenced section(s) before implementing any mission that cites them.

---

## §1. Problem

**Problem ID:** SIH26013 — Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management.

Urban land information is distributed across cadastral/parcel maps, municipal property records, drone survey data, building footprints, revenue land records, utility databases, GNSS/CORS survey information, ORI imagery, and DSM/DTM datasets. These describe the same real-world parcels/buildings but differ in file format, CRS, schema, field names, identifiers, geometry, boundaries, area, ownership attributes, update dates, quality, and completeness. Today this is reconciled manually by GIS experts — slow and error-prone. We're building an automated system that does much of this work.

## §2. What we're building

A web-based intelligent geospatial data harmonization platform. A user/official uploads multiple datasets representing the same geographic area; the system normalizes, matches, flags conflicts, scores confidence, routes uncertain cases to a human, and shows the unified result as a table + interactive map.

**Three representative prototype datasets:**

| Dataset | Fields |
|---|---|
| Cadastral/parcel | `parcel_id`, `owner_name`, `area`, `geometry` |
| Municipal property | `property_id`, `holder_name`, `plot_area`, `geometry` |
| Drone building footprint | `building_id`, `building_area`, `geometry` |

**Pipeline the engine performs:** file ingestion → schema detection → schema normalization → CRS detection/normalization → geometry validation → geometry repair where possible → attribute similarity matching → spatial matching → area comparison → conflict detection → confidence calculation → human review for uncertain records → unified record generation → interactive map visualization.

## §3. User journey

```
USER/OFFICIAL → WEB APP → UPLOAD DATASETS → INGESTION → SCHEMA NORMALIZATION
→ CRS NORMALIZATION → GEOMETRY VALIDATION → SPATIAL+ATTRIBUTE MATCHING
→ CONFLICT DETECTION → CONFIDENCE SCORING
        ├── >= 90% → AUTO ACCEPT ──────┐
        └── < 90%  → HUMAN REVIEW ─────┤
                                        ↓
                                UNIFIED RECORD
                                  ├── DATA TABLE
                                  └── INTERACTIVE MAP
```

## §4. Prototype philosophy

This is not a full implementation of every source type in the SIH brief — that's a multi-year system. We build the core harmonization pipeline on cadastral + municipal + drone data, with an architecture that *could* extend to revenue, utility, GNSS/CORS, ORI, and DSM/DTM. Say this explicitly to judges; never imply every government source is wired up.

## §5. Tech stack responsibilities

- **React + JavaScript + Tailwind**: UI, dashboard, upload, tables, review interface, map page.
- **Leaflet**: map tiles, parcel/building polygons, markers, click/popup, layer toggling, zoom/pan, highlighting. Leaflet does **not** do geospatial computation.
- **Node + Express** (application backend): REST API, project management, dataset upload handling, metadata, request validation, talks to FastAPI, serves application-level APIs. Does **not** do complex geospatial processing.
- **FastAPI** (geospatial engine): reading geospatial files, schema handling, CRS transformation, geometry validation/repair, spatial matching, attribute matching, area comparison, conflict detection, confidence scoring, unified result generation.
- **GeoPandas**: reading GeoJSON/shapefiles, geospatial dataframe ops, CRS, spatial joins.
- **Shapely**: geometry validation, intersection, containment, distance, area, overlap, repair.
- **PyProj**: CRS handling, coordinate transformation. Area/distance math should use an appropriate **projected** CRS, not raw lat/lng.
- **PostgreSQL + PostGIS**: stores projects, datasets, metadata, normalized records, geometries, matches, conflicts, confidence scores, review decisions. Use `ST_Intersects`, `ST_Contains`, `ST_Within`, `ST_Distance`, `ST_Area`, `ST_Intersection`, `ST_Transform` for spatial queries — don't duplicate this logic in Python where PostGIS already does it well.

**Traffic direction is fixed:** `React → Node → FastAPI`, never `React → FastAPI` directly, unless there's a specific documented reason.

## §6. Data model

| Table | Fields |
|---|---|
| `projects` | id, name, description, created_at |
| `datasets` | id, project_id, name, source_type, file_name, file_format, crs, uploaded_at, status |
| `records` | id, dataset_id, source_record_id, parcel_id, owner_name, area, geometry, normalized_attributes |
| `matches` | id, project_id, source_record_a, source_record_b, spatial_score, area_score, attribute_score, confidence, status |
| `conflicts` | id, match_id, type, severity, description, resolved |
| `reviews` | id, match_id, reviewer, decision, comment, created_at |

Preserve original source data alongside normalized and unified representations — never destroy source values. This traceability matters for government data specifically.

## §7. Schema normalization

Map source-specific field names to canonical fields via known mapping rules + string similarity/fuzzy matching (an LLM may optionally assist, but the system must not depend on one for basic function):

```
owner_name → owner_name
holder_name → owner_name
landholder → owner_name

area / plot_area / parcel_area / land_area → area
```

Canonical schema target: `owner_name`, `area`, `parcel_id`, `geometry`.

## §8. CRS normalization

Detect source CRS, transform to one common CRS for the project. Store the normalized CRS in dataset metadata. **Never** silently assume a CRS — if it's genuinely undeterminable, flag the record (`CRS_REVIEW_REQUIRED`) rather than guessing.

## §9. Geometry validation

Check missing/invalid/empty/malformed/duplicate geometry and geometry-type consistency. Attempt safe repair; if repair fails, flag for review rather than silently dropping the record.

## §10. Spatial + attribute matching, and confidence formula

IDs alone can't be trusted across sources (a parcel might be `P101` in cadastral, `M-782` in municipal, `B21` in drone data) — matching relies on spatial overlap, distance, area similarity, and attribute similarity.

```
Overall Confidence = 0.50 × Spatial Similarity + 0.20 × Area Similarity + 0.30 × Attribute Similarity
```

Worked example:
```
Spatial similarity = 0.96
Area similarity    = 0.90
Attribute similarity = 0.93
Confidence = 0.50(0.96) + 0.20(0.90) + 0.30(0.93) = 0.939 = 93.9%
```

Weights must be configurable, not hardcoded inline. The UI must show the component scores, not just the final number — this is a demo-critical explainability requirement (see §52 equivalent below).

**Threshold:** `confidence >= 0.90` → `AUTO_VERIFIED` (e.g. 96% auto-matched). `< 0.90` → `REQUIRES_REVIEW` (e.g. 82% needs a human). Threshold is a config value.

## §11. Human-in-the-loop

The system must never pretend automation is perfect. Below-threshold matches route to a human with a side-by-side comparison:

```
Cadastral: Owner "Amit Singh", Area 310 m²
Municipal: Owner "Amit Kumar", Area 334 m²

Spatial overlap: 91%   Area similarity: 86%   Name similarity: 73%
Overall confidence: 82%

[ Accept Match ]  [ Reject Match ]  [ Edit / Resolve ]
```

On accept: `status = HUMAN_VERIFIED`. Source records are never destructively overwritten.

## §12. Conflict types

- **Owner conflict** — "Ravi Kumar" vs "Ravi K." is likely the same person (name-format variance); "Ravi Kumar" vs "Amit Singh" is a real conflict.
- **Area conflict** — e.g. 246 m² vs 262 m², flagged when the difference exceeds a configured tolerance.
- **Boundary conflict** — same real-world parcel, differing geometry; compute spatial difference/overlap.
- **Missing data** — exists in one dataset, absent in another → `MISSING_MUNICIPAL_RECORD` (or equivalent).

Conflict object shape:
```json
{ "type": "AREA_MISMATCH", "severity": "MEDIUM", "description": "..." }
```

## §13. Unified record shape

```json
{
  "parcel_id": "P101",
  "owner_name": "Ravi Kumar",
  "area": 246,
  "building_id": "B21",
  "confidence": 96,
  "status": "AUTO_VERIFIED",
  "sources": ["cadastral", "municipal", "drone"],
  "conflicts": []
}
```
Problematic case:
```json
{
  "parcel_id": "P102",
  "owner_name": null,
  "confidence": 82,
  "status": "REQUIRES_REVIEW",
  "sources": ["cadastral", "municipal"],
  "conflicts": ["OWNER_MISMATCH", "AREA_MISMATCH"]
}
```
For the prototype a flat `sources` array per record is enough provenance; per-field provenance (`{"owner_name": {"value": "...", "sources": [...]}}`) is a stretch goal, not required.

## §14. Map requirements

Leaflet is a core part of the prototype, not decoration — do not ship a table-only app.

**Layers (toggleable):** Unified Parcels, Cadastral, Municipal, Drone Buildings. (Revenue/Utilities/GNSS/Imagery are future-scope checkboxes only, not implemented.)

**Click interaction — clean record:**
```
PARCEL P101
Owner: Ravi Kumar   Area: 246 m²   Building: B21
Sources: ✓ Cadastral ✓ Municipal ✓ Drone
Confidence: 96%   Status: AUTO VERIFIED
Conflicts: None
```
**Click interaction — problem record:**
```
PARCEL P102
Confidence: 82%   Status: REQUIRES REVIEW
⚠ Owner mismatch   ⚠ Area mismatch
[Review Record]
```
Problematic parcels must be visually distinct on the map — but never by color alone; pair it with a label/icon/status text for accessibility.

## §15. Data table

Columns: `Parcel ID | Owner | Area | Building | Sources | Confidence | Status | Conflicts | Action`.
Search by parcel ID / property ID / owner / building ID. Filters: All / Verified / Requires Review / Conflicts / Missing Data, plus a confidence-range filter (`<90%`, `90–95%`, `>95%`). Clicking a row should focus the corresponding map feature, and vice versa where practical — this sync is what makes it feel like one GIS system instead of two disconnected screens.

## §16. Dashboard

Real metrics only, pulled from actual processing results — never hardcode fake numbers once the pipeline works:
```
Datasets: 3   Records Processed: 1,245   Matched: 1,102
Conflicts: 43   Human Review: 17   High Confidence: 89%
```

## §17. Screens (upload / processing / results / review)

**Upload:** one upload control per dataset type (Cadastral, Municipal, Drone Building), plus a "Process Data" action. GeoJSON is the required format for the prototype; don't burn time on other formats.

**Processing:** a real (not faked) progress indicator reflecting actual backend stages — `Reading datasets → Detecting schema → Normalizing fields → Normalizing CRS → Validating geometry → Matching records → Detecting conflicts → Calculating confidence`. If exact stage sync is hard, a simpler real "processing" state is acceptable — but never fabricate progress that doesn't reflect what's happening.

**Result summary:** `1,245 records processed · 1,102 matches · 43 conflicts · 17 require review`, with links to Map / Records / Review.

**Human review list:** only uncertain/conflicting records, each showing confidence and the specific conflict reasons, linking into the full source comparison (§11).

## §18. Navigation shape

```
LANDHARMONIZE
├── Dashboard
├── Datasets
├── Processing
├── Unified Map
├── Records
└── Review
```
Professional, clean, information-dense but readable, restrained, map-centric. Not overdesigned.

## §19. Optional AI (never core-path)

- **Schema mapping suggestion**: `"holder_nm"` → suggest `owner_name`, reviewable, never auto-applied.
- **Conflict explanation**: turn already-computed numbers into plain language, e.g. *"the cadastral and municipal records likely represent the same parcel because their geometries overlap by 91%, but owner names differ substantially and reported areas differ by ~7.7%."*

**Hard rule:** an LLM is never authoritative for geometry, coordinates, area, distance, spatial relationships, record IDs, or government records. Those come only from real data and deterministic algorithms.

## §20. What the prototype does NOT claim

Not: legal ownership determination, authoritative title verification, production government deployment, perfect matching, legal cadastral finalization, guaranteed accuracy, nationwide scalability, real-time integration with all government systems, or real government database access unless legitimately provided.

## §21. Core value proposition (say this to judges)

> "We transform fragmented and inconsistent geospatial datasets into a unified, validated and confidence-scored land information layer, while keeping humans in the loop for uncertain cases."

## §22. 2-minute demo script

- **0:00–0:20** — explain the problem: the same parcel can have different IDs, names, boundaries, areas across sources.
- **0:20–0:35** — upload Cadastral, Municipal, Drone datasets.
- **0:35–0:50** — click Process; show schema normalization, CRS normalization, geometry validation, spatial matching, conflict detection happening.
- **0:50–1:10** — open Unified Map, click a clean parcel, show owner/area/building/sources/confidence.
- **1:10–1:30** — click a problem parcel, show 82% with owner + area mismatch.
- **1:30–1:45** — human reviews it: Accept / Reject / Resolve.
- **1:45–2:00** — back to the map, close with the core value proposition (§21).

## §23. Sample data test cases (must all exist, deterministically)

| Case | Scenario |
|---|---|
| A | High-confidence perfect match |
| B | Name variation ("Ravi Kumar" vs "Ravi K.") — should still match |
| C | Genuine owner conflict ("Ravi Kumar" vs "Amit Singh") — should flag |
| D | Area discrepancy (e.g. 246 m² vs 268 m²) — flagged per tolerance |
| E | Boundary mismatch — same parcel, differing geometry |
| F | Missing record — exists in one dataset, absent in another |
| G | Low-confidence candidate, below 90% |

No unseeded randomness — a fixed seed if variation is generated, so results are reproducible every run, offline, with no dependency on external APIs or live government servers.

## §24. Future scope (explicitly not MVP)

Versioned geospatial repository (GitHub-like project → dataset → versions, public/private, org access, audit trail, rollback, publishing); manual map editing (draw/edit/split/merge); additional sources (revenue, utility, GNSS/CORS, ORI, DSM/DTM, satellite); advanced GeoAI (CV, change detection, automated topology correction, imagery-to-vector extraction); auth/RBAC beyond a minimal demo login; dataset versioning; large-scale cloud deployment.

## §25. Definition of done (full prototype)

A user, from the browser alone, with no manual code intervention, can: open the app → create/select a project → upload all three datasets → start processing → see status → see normalized data → see matches with confidence → see conflicts → open the unified map → click a parcel → view its info → open a low-confidence record → compare sources → accept/reject/resolve → see the updated status reflected everywhere → search/filter records → and repeat the whole flow deterministically.