# Darukaa.Earth — Geospatial Carbon & Biodiversity Analytics Platform

[![CI/CD Pipeline](https://github.com/trilochams2035-cpu/darukaa-hackathon/actions/workflows/ci.yml/badge.svg)](https://github.com/trilochams2035-cpu/darukaa-hackathon/actions)
[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg)](https://react.dev)
[![Mapbox GL JS](https://img.shields.io/badge/Mapbox-GL%20JS-blue.svg)](https://www.mapbox.com/)
[![PostgreSQL / PostGIS](https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg)](https://postgis.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Darukaa.Earth** is a full-stack platform for monitoring ecological restoration projects, carbon sequestration, and biodiversity data using geospatial information.

The project was built for the **Darukaa.Earth Full-Stack Developer Hackathon**.

---

## 🌍 Key Features & User Stories

### 1. Project & Multi-Site Management

- Administrators can create and manage conservation projects across different ecosystems such as Tropical Rainforest, Mangrove Blue Carbon, Peatland, and Agroforestry.
- Each project can contain multiple geographical sites with their own ecological information and objectives.

### 2. Interactive Geospatial Mapbox Explorer

- Displays site boundaries as interactive polygons with habitat-based colors.
- Supports Satellite, Dark Earth, and Terrain map views.
- Includes 3D terrain visualization.
- Automatically centers the map around selected site boundaries using `fitBounds`.
- Provides hover-based information for geographical sites.

### 3. In-Browser Polygon Drawing & Spatial Verification

- Users can draw new site boundaries directly on the map using `@mapbox/mapbox-gl-draw`.
- Calculates the area of drawn polygons in hectares.
- Uses Turf and PostGIS geospatial calculations for area and spatial data.
- Validates drawn boundaries and calculates the site centroid.
- Saved site boundaries can be exported as GeoJSON for use in external GIS tools.

### 4. Environmental Analytics

The platform provides time-series data for monitoring environmental and biodiversity indicators over a 36-month period.

The analytics include:

- **Carbon Stock** — total stored carbon in `tCO₂e`.
- **Sequestration Rate** — annual carbon sequestration in `tCO₂e/ha/yr`.
- **NDVI** — mean Sentinel-2 Normalized Difference Vegetation Index.
- **Canopy Cover** — percentage of vegetation cover.
- **Species Richness** — number of recorded flora and fauna species.
- **Shannon-Wiener Index** — biodiversity diversity index.
- **Biomass Density** and **Soil Moisture** measurements.

The dashboard uses interactive Chart.js visualizations and allows users to switch between 1-year, 2-year, and 3-year views.

### 5. Authentication & Access Control

- JWT-based authentication for user sessions.
- Role-Based Access Control (RBAC).
- Passwords are stored using bcrypt hashing.
- Protected API routes require a valid bearer token.

---

## 🏛️ System Architecture

The application is split into three main layers: the React frontend, FastAPI backend, and PostgreSQL/PostGIS database.

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
