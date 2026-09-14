---
description: Core architectural and engineering rules for SIH26013.
---

# SIH26013 Project Rules

## Project Context

Before making significant architectural or cross-layer changes, read:

@../docs/PROJECT_CONTEXT.md

## Core Rules

### Stack boundaries
- Frontend uses React + JavaScript. Never create TypeScript files.
- Frontend must never connect directly to PostgreSQL/PostGIS.
- Frontend must never call FastAPI directly. All requests go through Node/Express.
- Node.js/Express is the primary REST API.
- FastAPI is used only for Python-dependent geospatial services.
- PostgreSQL + PostGIS is the primary database.
- Use PostGIS for spatial operations instead of implementing spatial calculations unnecessarily in JavaScript or duplicating them in both Python and SQL.
- Leaflet is a visualization layer only — it must never perform geospatial computation.

### Coordinate order (common source of silent bugs)
- Leaflet coordinates are `[latitude, longitude]`.
- GeoJSON coordinates are `[longitude, latitude]`.
- Any code that reads a GeoJSON coordinate and passes it to a Leaflet API (or vice versa) must explicitly reorder it. Never assume the two are interchangeable.

### Contracts and change discipline
- Preserve API contracts between frontend and backend. If a contract must change, update both sides in the same change and say so explicitly.
- Before changing a database schema, inspect the affected backend/API/frontend dependencies.
- Before making cross-layer changes, trace: Database → Backend → API → Frontend → UI, and state what you traced.
- Do not introduce a new library when an existing project dependency already solves the problem. If you do add one, state why the existing stack couldn't do it.

### Data integrity
- Never destructively overwrite source record data. Normalized and unified representations are additive, not replacements.
- Never silently assume a CRS, a unit, or a schema mapping when it cannot be determined — flag it for review instead.
- Never fabricate coordinates, geometries, areas, government APIs, or government datasets. Synthetic demo data is expected but must be clearly labeled as synthetic everywhere it's shown.
- Core geospatial calculations (matching, confidence, conflict detection, geometry validation) must be deterministic. An LLM may assist with schema-mapping suggestions or plain-language explanations, but must never generate or modify coordinates, geometry, area, or confidence values.

### UI honesty
- Never build a UI control that doesn't actually work — hide unimplemented features or label them "Future scope."
- Never fake a loading/progress indicator that misrepresents what the backend is actually doing.

### Security
- Never expose secrets or credentials in frontend code.
- Validate all uploads, limit file size, sanitize filenames.
- Use environment variables for all configuration; never hardcode credentials or API keys; never commit `.env`.

### Process
- Read the existing project structure before creating new files. Do not assume a file doesn't exist without checking.
- Do not overwrite working code unnecessarily; prefer incremental changes.
- If a required change conflicts with these rules or with `PROJECT_CONTEXT.md`, stop and explain the conflict before proceeding — do not silently resolve it.
