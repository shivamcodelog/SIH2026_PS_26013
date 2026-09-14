---
description: Core architectural and engineering rules for SIH26013.
---

# SIH26013 Project Rules

## Project Context

Before making significant architectural or cross-layer changes, read:

@../../docs/PROJECT_CONTEXT.md

## Core Rules

- Frontend uses React + JavaScript. Never create TypeScript files.
- Frontend must never connect directly to PostgreSQL/PostGIS.
- Node.js/Express is the primary REST API.
- FastAPI is used only for Python-dependent services.
- PostgreSQL + PostGIS is the primary database.
- Preserve API contracts between frontend and backend.
- Use PostGIS for spatial operations instead of implementing spatial calculations unnecessarily in JavaScript.
- Leaflet coordinates are `[latitude, longitude]`.
- GeoJSON coordinates are `[longitude, latitude]`.
- Never expose secrets or credentials in frontend code.
- Do not introduce a new library when an existing project dependency already solves the problem.
- Before changing a database schema, inspect the affected backend/API/frontend dependencies.
- Before making cross-layer changes, trace:
  Database → Backend → API → Frontend → UI.