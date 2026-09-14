<div align="center">

# 🌍 SIH26013: Intelligent Geospatial Data Harmonization Platform

### *Automated Integration and Harmonization of Multi-Source Geospatial Data for Urban Land Record Management*

[![Smart India Hackathon](https://img.shields.io/badge/Smart%20India%20Hackathon-2024%2F2026-orange.svg)](https://sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-26013-blue.svg)](#-problem-statement)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20JavaScript%20%7C%20Tailwind-61dafb.svg)](frontend/)
[![API Gateway](https://img.shields.io/badge/API%20Gateway-Node.js%20%7C%20Express%20%7C%20JS-339933.svg)](node-server/)
[![Geo Engine](https://img.shields.io/badge/Geo%20Engine-FastAPI%20%7C%20GeoPandas-009688.svg)](geo-engine/)
[![Spatial DB](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20PostGIS-336791.svg)](database/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

</div>

---

## 📑 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Problem Statement](#-problem-statement)
3. [Key Features](#-key-features)
4. [System Architecture](#-system-architecture)
5. [Technology Stack](#-technology-stack)
6. [Repository Structure](#-repository-structure)
7. [Quickstart & Local Setup](#-quickstart--local-setup)
   - [Prerequisites](#prerequisites)
   - [Environment Configuration](#1-environment-configuration)
   - [Spatial Database Setup](#2-spatial-database-setup)
   - [API Gateway Setup (Node/Express)](#3-api-gateway-setup-nodeserver)
   - [FastAPI Geospatial Engine Setup](#4-fastapi-geospatial-engine-setup-geoengine)
   - [Frontend WebGIS Setup](#5-frontend-webgis-setup-frontend)
8. [Sample Datasets & Harmonization Pipeline](#-sample-datasets--harmonization-pipeline)
9. [Mission Roadmap](#-mission-roadmap)
10. [Authors & Contribution](#-authors--contribution)

---

## 📌 Executive Summary

Urban land record administration faces severe friction due to fragmented, multi-source geospatial data. Cadastral maps, municipal tax registries, drone photogrammetry, and utility layers frequently describe the exact same physical parcel with diverging boundaries, mismatched coordinate systems (CRS), spelling inconsistencies, and conflicting ownership records.

**SIH26013** is an end-to-end intelligent geospatial harmonization platform. It automates dataset ingestion, coordinate reprojection, spatial and semantic entity matching, topological conflict detection, and confidence scoring. Discrepancies below certainty thresholds are seamlessly dispatched to a human-in-the-loop review workflow, while unified layers are projected onto an interactive WebGIS map interface.

> [!NOTE]
> This repository strictly uses **pure JavaScript** (`.js`, `.jsx`) across the entire JavaScript ecosystem (React & Node.js). TypeScript is intentionally excluded to maintain rapid prototyping velocity, clean code structure, and zero transpilation overhead.

---

## 🎯 Problem Statement

* **ID**: `SIH26013`
* **Title**: Automated Integration and Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Record Management
* **Domain**: Geospatial Information Systems (GIS), Urban Planning, Revenue & Land Administration

### Challenges Addressed:
* **Heterogeneous Coordinate Reference Systems**: EPSG:4326 (WGS84), UTM projections, and arbitrary local surveyor grids.
* **Schema Discrepancies**: Diverse naming conventions (e.g., `parcel_id` vs `property_no` vs `plot_code`).
* **Boundary Inconsistencies**: Spatial overlap, sliver polygons, and area variance between survey authorities.
* **Owner Identity Variations**: Spelling differences, abbreviations, phonetic variations, or conflicting registered owners.

---

## ✨ Key Features

* **Multi-Format Geospatial Ingestion**: Upload and parse GeoJSON, Shapefiles, and CAD boundaries with metadata inspection.
* **Intelligent Entity Matching**: Combines spatial intersection (IoU), centroid proximity, boundary Hausdorff distance, and attribute similarity (Levenshtein distance).
* **Multi-Tier Confidence Scoring**:
  * **Auto-Merged (High Confidence ≥ 90%)**: Flawless geographic and legal alignment.
  * **Flagged for Review (Medium/Low Confidence < 90%)**: Boundary shifts, area variances, or owner conflicts.
  * **Unmatched / New Entities**: Isolated parcels or undocumented building footprints.
* **Interactive WebGIS Visualizer**: Multi-layer inspection powered by Leaflet, displaying source overlays, unified boundaries, and dispute heatmaps.
* **Human-in-the-Loop Review Queue**: Dedicated administrative interface to accept, adjust, or resolve flagged discrepancies.
* **Audit Trail & Provenance**: Preserves original source records non-destructively alongside normalized and unified records.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    User([Urban Official / Surveyor]) -->|Interacts| UI[React 19 + JavaScript WebGIS]
    
    subgraph Frontend [Presentation Layer]
        UI --> MapView[Leaflet Map View]
        UI --> TableView[Data & Conflict Tables]
        UI --> ReviewQueue[Human Review Interface]
    end
    
    UI -->|REST API / JSON| Gateway[Node.js + Express Gateway (node-server)]
    
    subgraph Backend [Application & Orchestration Layer]
        Gateway --> ProjectMgr[Project & Dataset Manager]
        Gateway --> ReviewService[Review & Conflict Store]
    end
    
    Gateway -->|Forward Geospatial Jobs| FastEngine[FastAPI Geospatial Engine (geo-engine)]
    
    subgraph GeoEngine [Spatial Computation Layer]
        FastEngine --> Normalizer[CRS & Schema Normalization]
        FastEngine --> MatchEngine[GeoPandas / Shapely Matcher]
        FastEngine --> ConflictDetector[Conflict & IoU Calculator]
    end
    
    Gateway --> DB[(PostgreSQL + PostGIS)]
    FastEngine --> DB
```

---

## 💻 Technology Stack

| Layer | Technologies | Primary Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 19, JavaScript (`.jsx`), Vite, Tailwind CSS, Leaflet | Interactive WebGIS interface, layer toggle, conflict review console |
| **API Gateway** | Node.js (ESM), Express, JavaScript (`.js`) | REST API, dataset metadata, project sessions, review audit log |
| **Geo Engine** | Python 3.10+, FastAPI, GeoPandas, Shapely, PyProj | Geometry validation, coordinate reprojecting, spatial join, IoU scoring |
| **Database** | PostgreSQL 16+, PostGIS 3.4+ | Persistent spatial tables, spatial indexing (GIST), spatial queries (`ST_Intersects`, `ST_Area`) |
| **DevOps** | Docker, Docker Compose, Git | Containerized PostGIS instance, local developer reproducibility |

---

## 📂 Repository Structure

```text
SIH26013/
├── .agent/                 # GSD agent configuration & automation hooks
├── .agents/                # Team agent skills (Leaflet, PostGIS, API Design)
├── database/               # Database migrations & spatial schema
│   └── init.sql            # PostGIS extension & spatial baseline
├── docs/                   # Master Build Specifications & Architecture docs
│   └── PROJECT_CONTEXT.md  # Core project requirements & specification
├── frontend/               # React 19 + JavaScript + Tailwind WebGIS
│   ├── .env.example        # Frontend environment template
│   ├── src/
│   │   ├── components/     # UI building blocks (Header, etc.)
│   │   ├── pages/          # Full page views (Home, etc.)
│   │   ├── api/            # API client calls
│   │   ├── hooks/          # Custom React hooks (useHealth, etc.)
│   │   ├── types/          # JavaScript schemas & constants
│   │   ├── map/            # Leaflet map modules
│   │   ├── lib/            # Utility helpers
│   │   ├── App.jsx         # App root component
│   │   └── main.jsx        # React entrypoint
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build configuration with Tailwind plugin
├── geo-engine/             # FastAPI Geospatial Engine
│   ├── app/
│   │   ├── routes/         # FastAPI endpoint routers (health, etc.)
│   │   ├── services/       # Geospatial calculation services
│   │   ├── models/         # Pydantic validation schemas
│   │   ├── utils/          # CRS and projection utilities
│   │   └── main.py         # FastAPI main application
│   ├── .env.example        # Geo Engine environment template
│   └── requirements.txt    # Python geospatial dependencies
├── node-server/            # Node.js + Express API Gateway
│   ├── src/
│   │   ├── controllers/    # Request handlers (health, etc.)
│   │   ├── routes/         # Express routing definitions
│   │   ├── services/       # Business logic & orchestration
│   │   ├── middleware/     # Error handling & authentication
│   │   ├── config/         # Environment configuration
│   │   └── app.js          # Express app entrypoint
│   ├── .env.example        # Node server environment template
│   └── package.json        # Node server dependencies
├── sample-data/            # Synthetic benchmark datasets
│   └── README.md           # Dataset documentation (Cadastral, Municipal, Drone)
├── .env.example            # Monorepo/Root environment template
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # PostGIS Docker Compose configuration
├── mission-playbook.md     # Step-by-step AI agent mission roadmap
└── README.md               # Project documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* **Node.js**: `v20.x` or higher (`node -v`)
* **npm**: `v10.x` or higher
* **Python**: `3.10+` (for FastAPI engine)
* **Docker & Docker Compose** (recommended for PostGIS): [Install Docker Desktop](https://www.docker.com/)

---

### 1. Environment Configuration

Copy the sample environment file to create your local `.env`:

```bash
cp .env.example .env
```

---

### 2. Spatial Database Setup

Start PostgreSQL with PostGIS using Docker Compose:

```bash
# Start PostGIS container in background
docker compose up -d db

# Verify container is running
docker compose ps
```

The database will initialize automatically with the PostGIS extension loaded via [`database/init.sql`](database/init.sql).

---

### 3. API Gateway Setup (`node-server/`)

Navigate to the `node-server/` directory, install dependencies, and start the server:

```bash
cd node-server

# Install dependencies (first time only)
npm install

# Start backend server
npm start

# For development with live reload:
npm run dev
```

The server runs on `http://localhost:5000`. Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{"success": true, "service": "node-server"}
```

---

### 4. FastAPI Geospatial Engine Setup (`geo-engine/`)

In a new terminal, run the FastAPI service:

```bash
cd geo-engine

# Run the FastAPI server
python -m uvicorn app.main:app --port 8000 --reload
```

The FastAPI engine runs on `http://localhost:8000`. Test the health endpoint:
```bash
curl http://localhost:8000/health
```
Response:
```json
{
  "success": true,
  "service": "geo-engine",
  "type": "FastAPI Geospatial Engine",
  "status": "online"
}
```

Interactive API documentation is available at: **`http://localhost:8000/docs`**

---

### 5. Frontend WebGIS Setup (`frontend/`)

In a new terminal, launch the Vite development server:

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev
```

Open your browser at **`http://localhost:5173`** to access the WebGIS interface.

---

## 📊 Sample Datasets & Harmonization Pipeline

The prototype processes three representative datasets located in [`sample-data/`](sample-data/):

1. **Cadastral Records**: Legal plot boundaries, cadastral identifiers, registered ownership.
2. **Municipal Records**: Local municipal property tax polygons, address data, assessment values.
3. **Drone Footprints**: High-resolution building outlines from photogrammetric surveys.

### Test Scenarios Covered:
* **High Confidence Alignment**: Precise spatial boundary overlap + exact name match.
* **Attribute Discrepancy**: Minor name variation (e.g., *Ravi Kumar* vs. *Ravi K.*) requiring fuzzy string matching.
* **Boundary Deviation**: Outdated cadastral boundary vs. updated drone/municipal polygon.
* **Ownership Dispute**: Spatial overlap with contradictory owner records, dispatched to Human Review.

---

## 🗺 Mission Roadmap

Development follows the structured [`mission-playbook.md`](mission-playbook.md):

- [x] **Mission 1: Project Foundation** — Environment audit, directory scaffolding, Docker Compose, .gitignore, and README documentation.
- [ ] **Mission 2: Spatial Database Schema** — PostGIS tables (`projects`, `datasets`, `source_records`, `matches`, `conflicts`, `reviews`).
- [ ] **Mission 3: Synthetic GeoJSON Benchmark Data** — Deterministic test parcels and ground truth pairs.
- [ ] **Mission 4: FastAPI Ingestion Engine** — Geometry validation, schema detection, and CRS transformation.
- [ ] **Mission 5: Harmonization & Conflict Detection Engine** — Spatial IoU, Hausdorff distance, attribute scoring.
- [ ] **Mission 6: Node.js Orchestration API** — Project endpoints, dataset status, review resolution routes.
- [ ] **Mission 7: React WebGIS UI & Visualizer** — Leaflet map layers, conflict review split-pane, inspection tables.
- [ ] **Mission 8: End-to-End Verification & Presentation** — Demo scenario verification and audit export.

---

## 👥 Authors & Acknowledgments

* **Lead Developer**: Shivam Kumar aka sunflower ([@shivamcodelog](https://github.com/shivamcodelog))
* **Event**: Smart India Hackathon (SIH)
* **Problem Statement**: SIH26013

---

<div align="center">
  <b>Built for Smart India Hackathon 🇮🇳</b>
</div>
