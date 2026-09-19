# Darukaa.Earth — Geospatial Carbon & Biodiversity Analytics Platform

[![CI/CD Pipeline](https://github.com/darukaa-earth/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/darukaa-earth/platform/actions)
[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg)](https://react.dev)
[![Mapbox GL JS](https://img.shields.io/badge/Mapbox-GL%20JS-blue.svg)](https://www.mapbox.com/)
[![PostgreSQL / PostGIS](https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg)](https://postgis.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Darukaa.Earth** is a full-stack geospatial data intelligence platform engineered for monitoring, verifying, and reporting nature-based carbon sequestration and biodiversity net gains across global conservation corridors.

Built for the **Darukaa.Earth Full-Stack Developer Hackathon**.

---

## 🌍 Key Features & User Stories

1. **Project & Multi-Site Management**:
   - Administrators can register high-integrity conservation initiatives across multiple ecosystems (Tropical Rainforest, Mangrove Blue Carbon, Peatland, Agroforestry).
   - Each project contains multiple geographical parcel sites with custom ecological objectives.

2. **Interactive Geospatial Mapbox Explorer**:
   - Vector polygon rendering of site boundaries with color-coded fills by habitat type.
   - 3D terrain tilt and satellite imagery layer toggles (Satellite with labels vs. Dark Earth vs. Terrain).
   - Bounding-box camera centering (`fitBounds`) and hover inspector popups.

3. **In-Browser Polygon Drawing & Spatial Verification**:
   - Integrated `@mapbox/mapbox-gl-draw` polygon creation tool directly on the satellite base layer.
   - Real-time geodesic area calculation in hectares via turf and PostGIS geodetic spherical geometry.
   - Automatic topological validation and centroid computation.

4. **Deep-Dive Temporal Environmental Analytics**:
   - 36-month chronological time-series tracking:
     - **Cumulative Carbon Stock** ($tCO_2e$) and **Annual Sequestration Rate** ($tCO_2e/ha/yr$).
     - **Sentinel-2 Mean NDVI** (Normalized Difference Vegetation Index) with seasonal wet/dry oscillation.
     - **Canopy Foliage Cover %**.
     - **Species Richness** (flora & fauna count) and **Shannon-Wiener Biodiversity Index** ($H'$).
   - Interactive multi-axis Chart.js visualizations with custom dark-mode tooltips.
   - Interactive date-range filters (1 Year, 2 Years, 3 Years).
   - One-click GeoJSON boundary export for external GIS analysis.

5. **Security & Access Control**:
   - Role-Based Access Control (RBAC) with bcrypt salted password hashing and stateless JWT bearer tokens.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + Vite)"]
        UI[UI Components & Dashboard]
        MapBox[Mapbox GL JS v3 + Mapbox Draw]
        Charts[Chart.js / React-ChartJS-2]
        AuthContext[JWT Auth Context & Session]
    end

    subgraph Server ["Backend (Python FastAPI)"]
        API[FastAPI REST API Router]
        AuthSvc[Security & JWT Service]
        SpatialSvc[PostGIS Geospatial Engine]
        MockGen[Biological Growth Simulation Engine]
    end

    subgraph Storage ["Database (PostgreSQL + PostGIS)"]
        Users[(users)]
        Projects[(projects)]
        Sites[(sites & WGS84 Polygons)]
        Metrics[(site_metrics_timeseries)]
    end

    UI --> API
    MapBox --> API
    Charts --> API
    API --> AuthSvc
    API --> SpatialSvc
    API --> MockGen
    AuthSvc --> Users
    API --> Projects
    SpatialSvc --> Sites
    MockGen --> Metrics
```

---

## 🗄️ Database Schema

### `users`
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `hashed_password`: VARCHAR(255) NOT NULL
- `full_name`: VARCHAR(255) NOT NULL
- `role`: VARCHAR(50) DEFAULT 'admin'
- `created_at`, `updated_at`: TIMESTAMPTZ

### `projects`
- `id`: UUID (Primary Key)
- `title`: VARCHAR(255) NOT NULL
- `description`: TEXT
- `project_type`: VARCHAR(50) (e.g. `reforestation`, `mangrove`, `peatland_conservation`)
- `standard`: VARCHAR(100) (e.g. `Verra VCS`, `Gold Standard`, `Plan Vivo`)
- `status`: VARCHAR(50) DEFAULT 'active'
- `country`: VARCHAR(100) NOT NULL
- `owner_id`: UUID (Foreign Key -> `users.id` ON DELETE CASCADE)

### `sites`
- `id`: UUID (Primary Key)
- `project_id`: UUID (Foreign Key -> `projects.id` ON DELETE CASCADE, INDEX)
- `name`: VARCHAR(255) NOT NULL
- `description`: TEXT
- `habitat_type`: VARCHAR(100) NOT NULL
- `boundary`: `GEOMETRY(Polygon, 4326)` (PostGIS spatial column) / `boundary_geojson`
- `centroid_lat`, `centroid_lng`: FLOAT
- `area_hectares`: NUMERIC(12, 4) (Geodesic area via PostGIS `ST_Area`)
- `elevation_meters`: FLOAT

### `site_metrics_timeseries`
- `id`: UUID (Primary Key)
- `site_id`: UUID (Foreign Key -> `sites.id` ON DELETE CASCADE, INDEX)
- `record_date`: DATE NOT NULL (INDEX)
- `carbon_stock_tco2e`: FLOAT (Total biomass carbon stored)
- `sequestration_rate`: FLOAT ($tCO_2e/ha/yr$)
- `biomass_density`: FLOAT ($Mg/ha$)
- `ndvi_mean`: FLOAT (0.000 to 1.000)
- `canopy_cover_pct`: FLOAT (0.0% to 100.0%)
- `species_richness`: INT
- `shannon_index`: FLOAT (Shannon diversity index $H'$)
- `soil_moisture_pct`: FLOAT

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.12 and 3.14)
- Node.js 18+ and npm
- PostgreSQL with PostGIS (or instant cloud database like [Neon.tech](https://neon.tech) / [Supabase](https://supabase.com))

---

### 1. Backend Setup

```bash
# Navigate to workspace
cd Darukaa-Hackathon

# Create Python virtual environment
python -m venv backend/.venv

# Activate virtual environment
# Windows (PowerShell):
.\backend\.venv\Scripts\Activate.ps1
# Linux/macOS:
source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# (Optional) Set up your PostgreSQL/PostGIS connection in backend/.env:
# DATABASE_URL=postgresql+psycopg://user:password@host:port/dbname?sslmode=require
# Note: Defaults to sqlite:///./darukaa_earth.db if unset

# Seed demo showcase projects and admin user
python -m backend.app.seed

# Start the FastAPI development server
python -m uvicorn backend.app.main:app --reload --port 8000
```

Backend OpenAPI Documentation is available at:
👉 **`http://localhost:8000/docs`**

---

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend application runs at:
👉 **`http://localhost:5173`**

---

### 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Lead Administrator** | `admin@darukaa.earth` | `Admin123!` |

*(A 1-click "Fill Demo Creds" button is also present on the login screen for instant evaluation).*

---

## 🧪 Automated Testing & Code Quality

### Running Backend Unit Tests

```bash
# Run pytest suite with coverage
pytest backend/tests -v
```

### Running Linter & Formatter

```bash
# Run Ruff linting
ruff check backend

# Auto-fix linting issues
ruff check --fix backend
```

### Building Frontend Production Bundle

```bash
cd frontend
npm run build
```

---

## 🚢 Production Deployment

1. **Database**: Create a free PostgreSQL instance with PostGIS on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com). Run `CREATE EXTENSION postgis;`.
2. **Backend**: Deploy `backend/` to [Render](https://render.com) or [Railway](https://railway.app) with start command:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```
   Add environment variable `DATABASE_URL`.
3. **Frontend**: Deploy `frontend/` to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) with:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: `VITE_API_URL` and `VITE_MAPBOX_TOKEN`.

---

## 📄 License
MIT License. Developed for the Darukaa.Earth Hackathon.
