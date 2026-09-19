import pytest


@pytest.fixture
def sample_project_id(client, auth_headers):
    res = client.post(
        "/api/v1/projects/",
        json={"title": "Geospatial Site Test Project", "country": "Costa Rica"},
        headers=auth_headers,
    )
    return res.json()["id"]


def test_create_site_valid_polygon(client, auth_headers, sample_project_id):
    # Valid Polygon in Costa Rica (Osa Peninsula)
    polygon_geom = {
        "type": "Polygon",
        "coordinates": [
            [
                [-83.550, 8.520],
                [-83.520, 8.520],
                [-83.520, 8.500],
                [-83.550, 8.500],
                [-83.550, 8.520],
            ]
        ],
    }
    payload = {
        "project_id": sample_project_id,
        "name": "Osa Lowland Rainforest Sector",
        "description": "Primary rainforest protection and scarlet macaw monitoring.",
        "habitat_type": "tropical_moist_forest",
        "geometry": polygon_geom,
        "elevation_meters": 45.0,
    }

    response = client.post("/api/v1/sites/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["area_hectares"] > 0
    assert data["centroid_lat"] is not None
    assert data["centroid_lng"] is not None
    assert data["latest_carbon_stock"] > 0
    assert data["latest_ndvi"] > 0

    site_id = data["id"]
    assert site_id is not None

    # Verify GeoJSON FeatureCollection endpoint
    geojson_res = client.get(
        f"/api/v1/sites/geojson?project_id={sample_project_id}",
        headers=auth_headers,
    )
    assert geojson_res.status_code == 200
    fc = geojson_res.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) >= 1
    feature = fc["features"][0]
    assert feature["geometry"]["type"] == "Polygon"
    assert feature["properties"]["name"] == payload["name"]


def test_create_site_invalid_polygon_fails(
    client, auth_headers, sample_project_id
):
    invalid_geom = {
        "type": "Polygon",
        "coordinates": [
            [
                [-83.550, 8.520],
                [-83.520, 8.520],  # only 2 points - invalid ring
            ]
        ],
    }
    payload = {
        "project_id": sample_project_id,
        "name": "Broken Polygon",
        "geometry": invalid_geom,
    }
    response = client.post("/api/v1/sites/", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_site_analytics_and_overview(client, auth_headers, sample_project_id):
    # Create site
    polygon_geom = {
        "type": "Polygon",
        "coordinates": [
            [
                [-83.60, 8.60],
                [-83.58, 8.60],
                [-83.58, 8.58],
                [-83.60, 8.58],
                [-83.60, 8.60],
            ]
        ],
    }
    res = client.post(
        "/api/v1/sites/",
        json={
            "project_id": sample_project_id,
            "name": "Golfo Dulce Mangrove Reserve",
            "habitat_type": "mangrove",
            "geometry": polygon_geom,
        },
        headers=auth_headers,
    )
    site_id = res.json()["id"]

    # Fetch site analytics
    analytics_res = client.get(
        f"/api/v1/analytics/sites/{site_id}", headers=auth_headers
    )
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["site_name"] == "Golfo Dulce Mangrove Reserve"
    assert "kpis" in analytics_data
    assert "timeseries" in analytics_data
    assert len(analytics_data["timeseries"]) >= 24

    # Fetch dashboard overview
    overview_res = client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert overview_data["total_projects"] >= 1
    assert overview_data["total_sites"] >= 1
    assert overview_data["total_hectares"] > 0


def test_postgis_ddl_and_geometry_model():
    """Verify that Site model genuinely targets PostgreSQL/PostGIS geometry(POLYGON,4326) with GIST index."""
    from sqlalchemy import create_engine
    from sqlalchemy.schema import CreateIndex, CreateTable

    from backend.app.models.site import Site

    # 1. Verify PostgreSQL DDL compilation
    pg_engine = create_engine("postgresql+psycopg://user:pass@localhost:5432/db")
    ddl = str(CreateTable(Site.__table__).compile(pg_engine))

    assert "boundary geometry(POLYGON,4326)" in ddl
    assert "NOT NULL" in ddl

    # 2. Verify GIST spatial index
    gist_index = next(
        idx for idx in Site.__table__.indexes if idx.name == "idx_sites_boundary_gist"
    )
    assert gist_index is not None
    index_ddl = str(CreateIndex(gist_index).compile(pg_engine))
    assert "USING gist (boundary)" in index_ddl

    # 3. Verify GeoJSON conversion helpers
    poly_geom = {
        "type": "Polygon",
        "coordinates": [
            [
                [-70.0, -12.0],
                [-69.0, -12.0],
                [-69.0, -11.0],
                [-70.0, -11.0],
                [-70.0, -12.0],
            ]
        ],
    }
    site = Site(
        id="test-postgis-site",
        project_id="proj-123",
        name="PostGIS Native Site",
        boundary=poly_geom,
        area_hectares=100.0,
        centroid_lat=-11.5,
        centroid_lng=-69.5,
    )
    assert site.geom_shape is not None
    assert site.geom_shape.geom_type == "Polygon"

    geojson_dict = site.geometry_dict
    assert geojson_dict["type"] == "Polygon"
    assert len(geojson_dict["coordinates"][0]) == 5
    assert geojson_dict["coordinates"][0][0] == [-70.0, -12.0]

    feature = site.to_geojson_feature()
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Polygon"
    assert feature["properties"]["name"] == "PostGIS Native Site"
    assert feature["properties"]["area_hectares"] == 100.0
    assert feature["properties"]["centroid"] == [-69.5, -11.5]

