SIH26013 — AI Agent Mission Playbook

How to use this file

This document is the execution plan for building the SIH26013 prototype with an AI coding agent.

The agent must treat the previously defined Master Build Specification as the architectural source of truth and this document as the execution order.

The user should be able to say:

Execute Mission 1.

or:

Execute Mission 5.

The agent must then execute only that mission and its sub-missions, unless a prerequisite is genuinely missing and must be completed to make the mission testable.

0. PROJECT CONTEXT

Problem

SIH26013 is about:

Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management.

We are building a working Round-1 prototype, not a production government GIS system.

The prototype takes multiple heterogeneous geospatial datasets representing the same location, harmonizes them, matches records, detects conflicts, calculates confidence, routes low-confidence cases to human review, and displays the unified result through both tables and an interactive GIS map.

Core pipeline

User / Official
      ↓
React Web App
      ↓
Node / Express REST API
      ↓
FastAPI Geospatial Engine
      ↓
GeoPandas + Shapely + PyProj
      ↓
PostgreSQL + PostGIS
      ↓
Unified Geospatial Results
      ↓
┌───────────────┬────────────────┐
│ Result Tables │ Interactive Map│
└───────────────┴────────────────┘
      ↓
Human Review for Low Confidence

Primary prototype datasets

Only three datasets are required initially:

Cadastral / parcel dataset

Municipal property dataset

Drone-derived building footprint dataset

Use synthetic demo data.

Never present synthetic data as real government data.

1. GLOBAL AGENT RULES

These rules apply to every mission.

1.1 Source of truth

The agent must follow:

This mission document

The project's existing code/configuration

The Master Build Specification

Explicit instructions from the user in the current mission

Do not invent requirements.

1.2 Inspect before changing

Before modifying the project:

inspect repository structure

inspect existing files

inspect package manifests

inspect environment configuration

inspect database configuration

inspect existing API routes

inspect existing types/interfaces

inspect existing README

inspect git status if available

Never assume a file does not exist.

1.3 Do not rewrite working code

Prefer incremental changes.

Do not replace an entire application just because it is easier.

Do not delete working functionality without a reason.

1.4 No unnecessary dependencies

Before installing a package:

determine whether an existing dependency can solve the problem

explain why a new package is needed

use the smallest reasonable dependency

Do not introduce:

Kafka

Kubernetes

Celery

RabbitMQ

Redis

GraphQL

Elasticsearch

vector databases

complex microservices

unless the user explicitly requests them later.

1.5 Architecture is locked

The intended architecture is:

React + TypeScript + Tailwind + Leaflet
                 ↓
          Node + Express
                 ↓
             FastAPI
                 ↓
      GeoPandas / Shapely / PyProj
                 ↓
        PostgreSQL + PostGIS

Responsibilities:

React

UI, map, forms, tables, review interface.

Node/Express

Application API, project management, dataset metadata, orchestration.

FastAPI

Geospatial processing.

Python libraries

Actual geospatial operations.

PostgreSQL/PostGIS

Persistent relational and spatial storage.

Leaflet

Interactive map visualization only.

1.6 No fake functionality

Do not create UI buttons that pretend to work.

If a feature is not implemented, either:

do not show it, or

clearly mark it as future scope.

1.7 No fabricated geospatial facts

Never invent:

CRS values

coordinates

areas

spatial relationships

government APIs

government datasets

legal ownership claims

Synthetic data may be generated for demonstration, but it must be explicitly identified as synthetic.

1.8 No LLM dependency for core processing

The core pipeline must work without an external LLM API.

Optional AI can later assist with:

schema mapping

conflict explanation

But spatial calculations, matching signals, confidence and geometry validation must be deterministic/reproducible.

1.9 Keep original source data

Never destructively overwrite source records.

Maintain:

Original source data
        +
Normalized data
        +
Unified data

1.10 Explain major decisions

If a major architectural change is required, stop and explain the issue before making the change.

Do not silently redesign the system.

2. MISSION STATUS PROTOCOL

At the beginning of every mission:

State the mission being executed.

Inspect the current repository.

Identify what is already complete.

Identify missing prerequisites.

Execute the mission.

Test the work.

Fix failures caused by the mission.

Provide a concise completion report.

At the end:

MISSION STATUS
---------------
Completed:
- ...

Tests:
- ...

Files changed:
- ...

Known issues:
- ...

Ready for:
- Mission X

Do not claim success if the feature has not actually been tested.

3. MISSION 1 — PROJECT FOUNDATION

Objective

Create the complete development foundation for the SIH26013 application without implementing business logic.

Architecture

Create:

SIH26013/
├── frontend/
├── node-server/
├── geo-engine/
├── database/
├── sample-data/
├── docs/
├── .gitignore
├── .env.example
├── docker-compose.yml
└── README.md

Sub-mission 1.1 — Inspect environment

Determine:

operating system

installed Node version

installed npm/pnpm/yarn

Python version

PostgreSQL availability

Docker availability

Git availability

Do not install unrelated tools.

Sub-mission 1.2 — Initialize frontend

Create React + TypeScript application.

Requirements:

TypeScript

modern React

Tailwind CSS

basic routing if needed

clean component structure

Do not build application pages yet beyond a minimal shell.

Create:

frontend/src/
├── components/
├── pages/
├── api/
├── hooks/
├── types/
├── map/
├── lib/
└── App.tsx

Sub-mission 1.3 — Initialize Node backend

Create Node + Express TypeScript application if practical.

Provide:

GET /api/health

Response:

{
  "success": true,
  "service": "node-server"
}

Use environment configuration.

Sub-mission 1.4 — Initialize FastAPI

Create:

geo-engine/app/main.py

Provide:

GET /health

Response identifying the FastAPI service.

Create initial structure:

geo-engine/
├── app/
│   ├── main.py
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── utils/
└── requirements.txt

Sub-mission 1.5 — Database foundation

Prepare PostgreSQL + PostGIS configuration.

Do not create the complete production schema yet.

Verify that PostGIS can be enabled.

Sub-mission 1.6 — Environment configuration

Create:

.env.example

Include placeholders for:

database URL

Node port

FastAPI port

frontend API URL

optional future API keys

Never commit secrets.

Sub-mission 1.7 — Docker

If Docker is available, create a simple development setup.

Services may include:

PostgreSQL/PostGIS

Node backend

FastAPI

frontend if practical

Do not make Docker mandatory if local development is simpler.

Sub-mission 1.8 — Documentation

Create README containing:

project purpose

architecture

local setup

services

ports

commands

development status

Acceptance criteria

Mission 1 is complete when:

Frontend starts
Node starts
FastAPI starts
Database starts/connects
Health endpoints work
Repository structure exists
Environment configuration exists
README exists

4. MISSION 2 — DATABASE AND POSTGIS FOUNDATION

Objective

Create the minimal persistent data model.

Sub-mission 2.1 — Enable PostGIS

Verify:

CREATE EXTENSION IF NOT EXISTS postgis;

Verify spatial functions work.

Sub-mission 2.2 — Projects table

Create:

projects

Fields:

id
name
description
created_at
updated_at

Sub-mission 2.3 — Datasets table

Create:

datasets

Fields:

id
project_id
name
source_type
file_name
file_format
crs
record_count
status
uploaded_at

Sub-mission 2.4 — Source records

Create a normalized record table containing:

id
dataset_id
source_record_id
parcel_id
owner_name
area
geometry
normalized_attributes
created_at

Geometry should use an appropriate PostGIS geometry type.

Sub-mission 2.5 — Matches

Create:

matches

Include:

id
project_id
record_a_id
record_b_id
spatial_score
area_score
attribute_score
confidence
status
created_at

Sub-mission 2.6 — Conflicts

Create:

conflicts

Include:

id
match_id
type
severity
description
resolved
created_at

Sub-mission 2.7 — Reviews

Create:

reviews

Include:

id
match_id
reviewer
decision
comment
created_at

Sub-mission 2.8 — Indexes

Add sensible indexes.

At minimum:

project foreign keys

dataset foreign keys

spatial index on geometry

confidence/status indexes where useful

Sub-mission 2.9 — Migration/seed strategy

Create migrations or SQL scripts that can reproduce the schema.

Do not manually create a database that cannot be reproduced.

Acceptance criteria

The database can be recreated from code and supports:

Project
 ↓
Dataset
 ↓
Records
 ↓
Matches
 ↓
Conflicts
 ↓
Reviews

PostGIS spatial queries work.

5. MISSION 3 — SYNTHETIC DEMO DATA

Objective

Create realistic, deterministic GeoJSON datasets designed specifically to demonstrate harmonization.

Sub-mission 3.1 — Define common study area

Choose one small synthetic urban study area.

The geographic location does not need to represent real government records.

Document that it is synthetic.

Sub-mission 3.2 — Cadastral dataset

Create approximately 20–50 parcels.

Fields:

parcel_id
owner_name
area
geometry

Sub-mission 3.3 — Municipal dataset

Represent mostly the same parcels but deliberately introduce:

different IDs

name abbreviations

minor geometry differences

area discrepancies

missing records

at least one owner conflict

Fields:

property_id
holder_name
plot_area
geometry

Sub-mission 3.4 — Drone building dataset

Create building footprints.

Fields:

building_id
building_area
geometry

Place buildings inside or near parcels.

Sub-mission 3.5 — Required test cases

Ensure data contains:

Case A

High-confidence match.

Case B

Name variation:

Ravi Kumar
Ravi K.

Case C

Owner conflict.

Case D

Area mismatch.

Case E

Boundary mismatch.

Case F

Missing municipal record.

Case G

Low-confidence candidate below 90%.

Sub-mission 3.6 — Determinism

The data must produce predictable results.

Do not use random generation unless a fixed seed is used.

Acceptance criteria

Running the future matching pipeline against the datasets should reliably demonstrate:

successful matches

conflicts

low-confidence records

building-to-parcel relationships

6. MISSION 4 — FASTAPI INGESTION ENGINE

Objective

Build the first actual geospatial processing pipeline.

Input:

GeoJSON dataset.

Output:

Validated normalized geospatial data.

Sub-mission 4.1 — File ingestion

Create an endpoint/service capable of reading GeoJSON.

Validate:

file exists

valid JSON

valid GeoJSON

geometry exists

supported geometry types

Sub-mission 4.2 — Dataset metadata extraction

Extract:

feature count

geometry types

CRS if available

property names

bounding box where useful

Sub-mission 4.3 — Schema detection

Identify likely fields for:

ID
owner
area
geometry

Support known aliases.

Example:

owner_name
holder_name
landholder

→ canonical owner_name

And:

area
plot_area
parcel_area
land_area

→ canonical area

Sub-mission 4.4 — Schema normalization

Produce an internal canonical representation:

source_record_id
canonical_id
owner_name
area
geometry
source_dataset

Do not destroy original attributes.

Sub-mission 4.5 — CRS handling

Detect CRS where available.

Normalize to a common project CRS.

For prototype analysis, use a projected CRS suitable for metric distance/area calculations.

Do not blindly assume missing CRS.

If CRS cannot be determined safely:

status = CRS_REVIEW_REQUIRED

Sub-mission 4.6 — Geometry validation

Check:

null

empty

invalid

unsupported geometry

Attempt safe repair where appropriate.

Track repair status.

Sub-mission 4.7 — Unit handling

Normalize area units if source metadata provides them.

Do not silently guess unknown units.

Sub-mission 4.8 — Processing response

Return structured metadata:

{
  "success": true,
  "records_processed": 42,
  "crs": "...",
  "geometry_types": ["Polygon"],
  "schema_mapping": {},
  "validation": {
    "valid": 40,
    "repaired": 1,
    "invalid": 1
  }
}

Acceptance criteria

A valid GeoJSON dataset can be:

uploaded
→ read
→ inspected
→ normalized
→ validated
→ returned as structured output

7. MISSION 5 — SPATIAL AND ATTRIBUTE MATCHING ENGINE

Objective

Determine which records from different datasets likely represent the same real-world entity.

Sub-mission 5.1 — Candidate generation

Do not compare every record against every other record if spatial filtering can reduce candidates.

Use:

bounding boxes

spatial index

proximity

intersection/overlap

Sub-mission 5.2 — Spatial similarity

Compute an explainable spatial similarity.

A reasonable approach for polygons:

intersection_area / union_area

or another clearly documented overlap metric.

Document the chosen metric.

Sub-mission 5.3 — Area similarity

Compare normalized areas.

Example conceptual formula:

1 - abs(area_a - area_b) / max(area_a, area_b)

Clamp to valid range.

Handle missing area safely.

Sub-mission 5.4 — Attribute similarity

Use normalized string comparison/fuzzy matching.

Handle:

Ravi Kumar
Ravi K.
RAVI KUMAR

reasonably.

Do not assume every similar name is the same person.

Sub-mission 5.5 — Confidence calculation

Initial prototype weighting:

50% spatial
20% area
30% attribute

Make weights configurable.

Handle missing signals explicitly rather than generating misleading scores.

Sub-mission 5.6 — Threshold

Default:

0.90

If confidence >= threshold:

AUTO_VERIFIED

If confidence < threshold:

REQUIRES_REVIEW

Sub-mission 5.7 — Match explanation

Return component scores:

{
  "spatial_score": 0.96,
  "area_score": 0.90,
  "attribute_score": 0.93,
  "confidence": 0.939
}

Sub-mission 5.8 — Deterministic testing

Create unit tests for:

exact match

name abbreviation

area mismatch

spatial mismatch

low-confidence case

missing attributes

Acceptance criteria

Given the synthetic datasets, the engine produces stable matches and understandable confidence scores.

8. MISSION 6 — CONFLICT DETECTION ENGINE

Objective

Detect inconsistencies between matched records.

Sub-mission 6.1 — Owner conflict

Compare normalized owner names.

Distinguish:

Ravi Kumar
Ravi K.

from:

Ravi Kumar
Amit Singh

Sub-mission 6.2 — Area conflict

Calculate:

absolute difference

percentage difference

Use configurable tolerance.

Sub-mission 6.3 — Boundary conflict

Compare geometry overlap/difference.

Generate a structured conflict.

Sub-mission 6.4 — Missing records

Detect:

exists in source A
missing in source B

Sub-mission 6.5 — Conflict severity

Use simple categories:

LOW
MEDIUM
HIGH

Document rules.

Sub-mission 6.6 — Conflict object

Example:

{
  "type": "AREA_MISMATCH",
  "severity": "MEDIUM",
  "description": "Reported area differs by 7.4%"
}

Acceptance criteria

The engine reliably generates conflicts from the synthetic test data.

9. MISSION 7 — UNIFIED RECORD GENERATION

Objective

Combine matched source records into a unified representation while preserving provenance.

Sub-mission 7.1 — Unified record

Include:

unified_id
parcel_id
owner_name
area
building_id
geometry
confidence
status
sources
conflicts

Sub-mission 7.2 — Provenance

Track where each important field came from.

Example:

{
  "owner_name": {
    "value": "Ravi Kumar",
    "sources": ["cadastral", "municipal"]
  }
}

A simpler source list is acceptable for the MVP.

Sub-mission 7.3 — Geometry

Use a documented rule for choosing/constructing unified geometry.

Do not arbitrarily overwrite geometry.

For prototype, a sensible harmonized geometry may be derived from the most trusted source or a documented combination.

Sub-mission 7.4 — Status

Possible statuses:

AUTO_VERIFIED
REQUIRES_REVIEW
HUMAN_VERIFIED
REJECTED

Acceptance criteria

Every successful match can produce a unified record that is traceable back to source records.

10. MISSION 8 — NODE/EXPRESS APPLICATION API

Objective

Build the application-level REST API.

Node communicates with FastAPI.

Frontend communicates with Node.

Sub-mission 8.1 — Health

Implement:

GET /api/health

Sub-mission 8.2 — Projects

Implement minimal:

POST /api/projects
GET /api/projects
GET /api/projects/:id

Sub-mission 8.3 — Dataset upload

Implement:

POST /api/projects/:id/datasets

Responsibilities:

validate request

store metadata

forward processing input to FastAPI as needed

return dataset information

Sub-mission 8.4 — Processing

Implement:

POST /api/projects/:id/process

Node should orchestrate the processing service.

Sub-mission 8.5 — Results

Implement:

GET /api/projects/:id/results
GET /api/projects/:id/conflicts
GET /api/projects/:id/map

Sub-mission 8.6 — Reviews

Implement:

POST /api/reviews/:id/decision

Accept:

ACCEPT
REJECT
RESOLVE

plus optional comment.

Sub-mission 8.7 — API contracts

Define TypeScript types for responses.

Do not allow frontend and backend to invent separate schemas.

Acceptance criteria

The full backend path works:

React-ready HTTP request
→ Node
→ FastAPI
→ database/results
→ Node response

11. MISSION 9 — FRONTEND APPLICATION SHELL

Objective

Build the basic professional UI before complex integration.

Pages

Create:

Dashboard
Datasets
Processing
Unified Map
Records
Review

Sub-mission 9.1 — Navigation

Create clear navigation.

Sub-mission 9.2 — Dashboard

Display project metrics.

Initially use API data when available.

Sub-mission 9.3 — Dataset page

Show:

dataset name

source type

file name

CRS

record count

status

Sub-mission 9.4 — Upload UI

Allow uploading the three demo datasets.

Show:

selected file

upload status

errors

success

Sub-mission 9.5 — Processing UI

Show:

Ingestion
Schema normalization
CRS normalization
Geometry validation
Matching
Conflict detection
Confidence scoring

Use real state where possible.

Acceptance criteria

A user can navigate the application and upload datasets without interacting with the backend manually.

12. MISSION 10 — LEAFLET GIS MAP

Objective

Make the geospatial nature of the project visually obvious.

Sub-mission 10.1 — Base map

Integrate Leaflet into React.

Use a suitable tile provider.

Keep provider configuration separate from application logic.

Sub-mission 10.2 — Unified parcel layer

Render unified parcel GeoJSON.

Sub-mission 10.3 — Building layer

Render drone building footprints.

Sub-mission 10.4 — Source layers

Support:

Unified
Cadastral
Municipal
Buildings

where data is available.

Sub-mission 10.5 — Layer control

Allow users to toggle layers.

Sub-mission 10.6 — Click interaction

Click parcel → show details.

Display:

Parcel ID
Owner
Area
Building
Confidence
Status
Sources
Conflicts

Sub-mission 10.7 — Confidence visualization

Visually distinguish:

high confidence
requires review
conflict

Do not rely only on color.

Sub-mission 10.8 — Map navigation

Support:

zoom

pan

fit bounds

selected parcel focus

Acceptance criteria

The browser shows a real interactive GIS map containing the processed prototype data.

13. MISSION 11 — RESULTS TABLE

Objective

Create the structured unified-data interface.

Sub-mission 11.1 — Table

Columns:

Parcel ID
Owner
Area
Building
Sources
Confidence
Status
Conflicts
Action

Sub-mission 11.2 — Search

Search by:

parcel ID

property ID

owner

building ID

Sub-mission 11.3 — Filters

Filters:

All
Verified
Requires Review
Conflicts
Missing Data

Sub-mission 11.4 — Confidence filter

Allow:

<90%
90–95%
>95%

Sub-mission 11.5 — Table/map synchronization

Click table row:

→ map focuses feature.

Click map feature:

→ table selection updates if practical.

Acceptance criteria

A user can inspect the unified result set without opening the database.

14. MISSION 12 — HUMAN-IN-THE-LOOP REVIEW

Objective

Implement the central human verification workflow.

Sub-mission 12.1 — Review queue

Show only records requiring review.

Sub-mission 12.2 — Record comparison

Show source records side-by-side.

Example:

CADASTRAL
Owner: Amit Singh
Area: 310 m²

MUNICIPAL
Owner: Amit Kumar
Area: 334 m²

Sub-mission 12.3 — Similarity breakdown

Show:

Spatial Similarity
Area Similarity
Attribute Similarity
Overall Confidence

Sub-mission 12.4 — Conflict list

Show detected conflicts.

Sub-mission 12.5 — Review actions

Implement:

Accept Match
Reject Match
Resolve

Sub-mission 12.6 — Persist decision

Save:

reviewer

decision

comment

timestamp

Sub-mission 12.7 — Update status

After acceptance:

REQUIRES_REVIEW
       ↓
HUMAN_VERIFIED

After rejection:

REJECTED

Sub-mission 12.8 — Map integration

Reviewed record should update its map/table status.

Acceptance criteria

A judge can see a low-confidence record, understand why it is uncertain, make a decision, and see the updated state.

15. MISSION 13 — COMPLETE END-TO-END INTEGRATION

Objective

Connect every component into one uninterrupted user journey.

Required flow

Create project
      ↓
Upload cadastral
      ↓
Upload municipal
      ↓
Upload drone
      ↓
Process
      ↓
FastAPI processing
      ↓
PostGIS persistence
      ↓
Unified results
      ↓
Dashboard summary
      ↓
Map
      ↓
Records
      ↓
Conflict
      ↓
Human review
      ↓
Updated result

Sub-mission 13.1 — Remove mock data

Replace UI-only mocks with actual API results wherever the underlying feature is implemented.

Sub-mission 13.2 — API error handling

Handle:

Node unavailable

FastAPI unavailable

database error

invalid file

processing error

Sub-mission 13.3 — Loading states

Show useful loading indicators.

Sub-mission 13.4 — Empty states

Examples:

No datasets uploaded.
No conflicts found.
No records require review.

Sub-mission 13.5 — State consistency

After human review:

table updates

dashboard counts update

map status updates

review queue updates

Acceptance criteria

The entire demo can be completed entirely through the browser.

16. MISSION 14 — UI POLISH

Objective

Make the prototype look like a serious government/enterprise GIS application.

Design principles

professional

clean

information-dense but readable

consistent

restrained

map-centric

Avoid:

excessive animations

flashy gradients

unnecessary 3D effects

gaming UI

excessive rounded cards

meaningless decorative elements

Sub-mission 14.1

Polish dashboard.

Sub-mission 14.2

Polish upload workflow.

Sub-mission 14.3

Polish processing visualization.

Sub-mission 14.4

Polish map + side panel.

Sub-mission 14.5

Polish records table.

Sub-mission 14.6

Polish human review screen.

Sub-mission 14.7

Responsive behavior for reasonable laptop/tablet widths.

17. MISSION 15 — EXPORT AND PROVENANCE

Objective

Add high-value features if time permits.

Sub-mission 15.1 — Export unified GeoJSON

Allow:

Download Unified GeoJSON

Sub-mission 15.2 — Export table

Optional CSV export.

Sub-mission 15.3 — Provenance

Show source information for unified fields.

Sub-mission 15.4 — Processing summary

Allow user to inspect what happened during harmonization.

Do not implement complex reporting unless time remains.

18. MISSION 16 — OPTIONAL AI ASSISTANCE

Only execute this mission after all MUST-HAVE functionality works.

Objective

Add AI only where it genuinely improves the prototype.

Sub-mission 16.1 — AI schema mapping

Given unknown columns:

holder_nm
plot_sz
pid

AI can suggest:

owner_name
area
parcel_id

The suggestion must be reviewable.

Sub-mission 16.2 — AI conflict explanation

Use actual computed values.

Example:

Spatial similarity: 91%
Area similarity: 86%
Attribute similarity: 73%
Confidence: 82%

AI explains the conflict.

Hard rule

The LLM must not generate or modify:

coordinates

geometry

area calculations

spatial similarity

confidence values

Those must come from the geospatial engine.

19. MISSION 17 — DEMO HARDENING

Objective

Make the prototype reliable enough for presentation.

Sub-mission 17.1 — Clean startup

Confirm:

Database
Node
FastAPI
Frontend

start reliably.

Sub-mission 17.2 — Clean database

Create a predictable reset/seed mechanism.

Sub-mission 17.3 — Demo dataset reset

Ensure sample datasets can be loaded repeatedly.

Sub-mission 17.4 — Deterministic results

Run the same input multiple times and verify stable results.

Sub-mission 17.5 — Error testing

Test:

bad GeoJSON

empty file

missing geometry

missing CRS

invalid geometry

backend unavailable

Sub-mission 17.6 — Browser test

Complete the entire flow manually.

Sub-mission 17.7 — Performance sanity

Do not optimize prematurely.

Confirm prototype datasets process in a reasonable amount of time.

20. MISSION 18 — FINAL PRESENTATION MODE

Objective

Prepare the application specifically for the SIH Round-1 demonstration.

Demo flow

Step 1

Open dashboard.

Step 2

Show problem:

Multiple datasets
Different schemas
Different boundaries
Different attributes

Step 3

Upload:

Cadastral
Municipal
Drone

Step 4

Process.

Show:

Schema normalization
CRS normalization
Geometry validation
Spatial matching
Conflict detection
Confidence scoring

Step 5

Show dashboard metrics.

Step 6

Open unified map.

Step 7

Toggle source layers.

Step 8

Click a high-confidence parcel.

Show:

Unified owner
Area
Building
Sources
Confidence
Status

Step 9

Click low-confidence parcel.

Show:

82%
Owner mismatch
Area mismatch
Boundary issue

Step 10

Open human review.

Step 11

Accept/reject/resolve.

Step 12

Return to map and show updated status.

21. MISSION 19 — FINAL AUDIT

Objective

Perform a complete technical and product audit.

Audit categories

Architecture

Verify:

React
 ↓
Node
 ↓
FastAPI
 ↓
PostGIS

Data

Verify:

original data preserved

normalized data exists

unified records traceable

synthetic data clearly labeled

Geospatial

Verify:

CRS handling

geometry validation

spatial matching

area calculation

geometry conflict detection

Matching

Verify:

attribute similarity

spatial similarity

confidence

threshold

Human review

Verify:

queue

comparison

decision

persistence

updated state

Frontend

Verify:

upload

processing

dashboard

table

map

review

Reliability

Verify:

errors handled

loading states

empty states

no broken buttons

Security

Verify:

no secrets committed

uploads validated

filenames handled safely

environment variables used

22. MISSION 20 — README AND TECHNICAL DOCUMENTATION

Objective

Create final documentation.

README must contain:

Project title

SIH problem ID

Problem explanation

Solution explanation

Architecture

Tech stack

Folder structure

Setup instructions

Environment variables

Running instructions

Dataset format

Matching algorithm

Confidence calculation

Human-in-the-loop workflow

Screenshots if available

Demo flow

Limitations

Future scope

Clearly state:

This is a prototype using synthetic demonstration datasets.

23. OPTIONAL FUTURE-SCOPE FEATURES

Do NOT prioritize these before the core prototype.

Geospatial repository

GitHub-like:

Project
 ├── Dataset
 │    ├── Version 1
 │    ├── Version 2
 │    └── Version 3

Possible features:

public/private datasets

organization access

version history

audit trail

rollback

publishing

Advanced map editing

Officials could:

draw parcels

edit boundaries

add buildings

split parcels

merge parcels

Additional data sources

Future:

revenue

utilities

GNSS/CORS

ORI

DSM/DTM

satellite imagery

Advanced GeoAI

Future:

computer vision

change detection

automated topology correction

imagery-to-vector extraction

These are not required for the Round-1 prototype.

24. DO NOT DO THESE THINGS

Unless explicitly requested by the user:

Do not rebuild the entire stack.

Do not add random dependencies.

Do not replace PostgreSQL/PostGIS with another database.

Do not replace FastAPI with another Python framework.

Do not replace Node/Express with another application backend.

Do not remove Leaflet.

Do not implement a vector database.

Do not add Redis.

Do not add Kafka.

Do not add Kubernetes.

Do not build a production authentication system.

Do not connect to imaginary government APIs.

Do not fabricate real government data.

Do not make the LLM responsible for spatial calculations.

Do not hide uncertainty.

Do not make every match automatically accepted.

Do not overwrite source data.

Do not spend time on future-scope features before the MVP works.

Do not optimize prematurely.

Do not create fake loading/progress indicators that misrepresent backend processing.

25. MVP DEFINITION

The MVP is complete when all of the following work:

[✓] React application
[✓] Node/Express API
[✓] FastAPI service
[✓] PostgreSQL/PostGIS
[✓] GeoJSON ingestion
[✓] Schema normalization
[✓] CRS normalization
[✓] Geometry validation
[✓] Spatial matching
[✓] Attribute matching
[✓] Confidence scoring
[✓] Conflict detection
[✓] Unified records
[✓] Human review
[✓] Leaflet map
[✓] Source layers
[✓] Parcel click
[✓] Result table
[✓] Search/filter
[✓] Dashboard
[✓] Synthetic demo datasets
[✓] End-to-end browser workflow

Everything else is secondary.

26. FINAL PRODUCT DEFINITION

The finished prototype should allow an official to do this:

OPEN WEBSITE
     ↓
CREATE PROJECT
     ↓
UPLOAD MULTIPLE LAND DATASETS
     ↓
SYSTEM AUTOMATICALLY:
     ├── Reads datasets
     ├── Maps schemas
     ├── Normalizes CRS
     ├── Validates geometry
     ├── Finds spatial matches
     ├── Compares attributes
     ├── Compares area
     ├── Detects conflicts
     └── Calculates confidence
     ↓
HIGH CONFIDENCE
     ↓
AUTO VERIFIED

LOW CONFIDENCE
     ↓
HUMAN REVIEW
     ↓
ACCEPT / REJECT / RESOLVE
     ↓
UNIFIED LAND RECORD
     ↓
TABLE + INTERACTIVE WEBGIS MAP

The central product idea is:

Fragmented geospatial data → automated harmonization → explainable matching → conflict detection → human verification → unified land information.

27. AGENT RESPONSE FORMAT

When the user says:

Execute Mission X

the agent should:

A. Inspect

Check current project state.

B. Plan

Identify the exact sub-missions that apply.

C. Implement

Make the required changes.

D. Test

Run appropriate tests/builds/type checks/service checks.

E. Fix

Fix errors caused by the implementation.

F. Report

Return:

Mission X completed.

Implemented:
- ...

Files changed:
- ...

Tests:
- ...

Result:
- ...

Known issues:
- ...

Next recommended mission:
Mission Y

Do not provide unnecessary theory when the user has explicitly asked to execute a mission.

28. EMERGENCY RULE

If the user is under severe time pressure, prioritize in this order:

1. End-to-end working flow
2. Geospatial processing
3. Matching/confidence
4. Human review
5. Interactive map
6. Results table
7. UI polish
8. Optional AI
9. Future features

If a mission becomes too large, split it internally while preserving the architecture.

Never sacrifice the working end-to-end demo merely to implement optional features.

29. FINAL COMMAND

The user should now be able to simply say:

Execute Mission 1

Then:

Execute Mission 2

Then:

Execute Mission 3

and continue sequentially.

The AI agent must use this document to maintain project continuity and must not repeatedly redesign the architecture.