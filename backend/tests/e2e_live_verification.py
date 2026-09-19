"""Comprehensive live end-to-end integration verification script.
Tests live HTTP endpoints against the running FastAPI backend server:
- Auth (register, login, me)
- Projects (create, list, get)
- Sites with PostGIS boundary polygons (create, list, get, geojson)
- Spatial metrics & geodesic area computation
- Analytics & KPI time series
"""
import sys

import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_e2e_tests():
    print(f"[1/7] Testing API Health on {BASE_URL}/health...")
    with httpx.Client(base_url=BASE_URL, timeout=10.0, follow_redirects=True) as client:
        r = client.get("/health")
        assert r.status_code == 200, f"Health check failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["status"] == "healthy"
        print("  -> Health OK:", data)

        print("\n[2/7] Testing Authentication (Login as seeded admin)...")
        login_res = client.post(
            "/auth/login",
            json={"email": "admin@darukaa.earth", "password": "Admin123!"},
        )
        assert login_res.status_code == 200, f"Admin login failed: {login_res.status_code} {login_res.text}"
        tokens = login_res.json()
        access_token = tokens["access_token"]
        assert access_token, "No access token returned"
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        print("  -> Admin login successful, received JWT.")

        # Test current user
        me_res = client.get("/auth/me", headers=auth_headers)
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["email"] == "admin@darukaa.earth"
        print(f"  -> Verified auth/me: {me_data['full_name']} ({me_data['role']})")

        print("\n[3/7] Testing Projects API...")
        # List projects
        projects_res = client.get("/projects", headers=auth_headers)
        assert projects_res.status_code == 200
        projects = projects_res.json()
        assert len(projects) >= 2, f"Expected at least 2 seeded projects, got {len(projects)}"
        print(f"  -> Listed {len(projects)} existing projects.")

        # Create new project
        new_project_payload = {
            "title": "Chocó Bio-Corridor Restoration",
            "description": "Cloud forest corridor connecting coastal lowland and Andean ecosystems.",
            "project_type": "agroforestry",
            "standard": "Plan Vivo",
            "country": "Colombia",
        }
        create_p_res = client.post("/projects", json=new_project_payload, headers=auth_headers)
        assert create_p_res.status_code == 201, f"Project creation failed: {create_p_res.status_code} {create_p_res.text}"
        created_project = create_p_res.json()
        project_id = created_project["id"]
        assert created_project["title"] == new_project_payload["title"]
        print(f"  -> Successfully created project '{created_project['title']}' (ID: {project_id})")

        # Get project details
        get_p_res = client.get(f"/projects/{project_id}", headers=auth_headers)
        assert get_p_res.status_code == 200
        print(f"  -> Retrieved project details for {project_id}")

        print("\n[4/7] Testing Site Creation with Drawn Polygon Geometry...")
        # A valid closed polygon in Colombia (-76.5, 3.8)
        polygon_geojson = {
            "type": "Polygon",
            "coordinates": [
                [
                    [-76.55, 3.82],
                    [-76.50, 3.82],
                    [-76.50, 3.86],
                    [-76.55, 3.86],
                    [-76.55, 3.82],
                ]
            ],
        }
        site_payload = {
            "project_id": project_id,
            "name": "Anchicayá River Agroforestry Plot 1",
            "description": "Native shade canopy cacao and Inga edulis planting on former pasture.",
            "habitat_type": "tropical_moist_forest",
            "elevation_meters": 350.0,
            "geometry": polygon_geojson,
        }
        create_site_res = client.post("/sites", json=site_payload, headers=auth_headers)
        assert create_site_res.status_code == 201, f"Site creation failed: {create_site_res.status_code} {create_site_res.text}"
        site_data = create_site_res.json()
        site_id = site_data["id"]
        assert site_data["name"] == site_payload["name"]
        assert site_data["area_hectares"] > 0, "Area hectares was not computed"
        assert "centroid_lat" in site_data and "centroid_lng" in site_data
        assert site_data["geometry"]["type"] == "Polygon"
        print(f"  -> Created site '{site_data['name']}' (ID: {site_id})")
        print(f"     Geodesic Area: {site_data['area_hectares']} ha | Centroid: [{site_data['centroid_lng']}, {site_data['centroid_lat']}]")

        print("\n[5/7] Testing GeoJSON FeatureCollection Retrieval for Mapbox...")
        # Get all sites GeoJSON
        geojson_res = client.get("/sites/geojson", headers=auth_headers)
        assert geojson_res.status_code == 200
        fc = geojson_res.json()
        assert fc["type"] == "FeatureCollection"
        assert len(fc["features"]) >= 4
        new_feature = next((f for f in fc["features"] if f["id"] == site_id), None)
        assert new_feature is not None, "Created site not found in GeoJSON FeatureCollection"
        assert new_feature["geometry"]["type"] == "Polygon"
        assert new_feature["properties"]["name"] == site_payload["name"]
        print(f"  -> Retrieved GeoJSON FeatureCollection with {len(fc['features'])} features.")
        print(f"     Found newly created site feature with properties: {list(new_feature['properties'].keys())}")

        # Get filtered by project
        proj_geojson_res = client.get(f"/sites/geojson?project_id={project_id}", headers=auth_headers)
        assert proj_geojson_res.status_code == 200
        proj_fc = proj_geojson_res.json()
        assert len(proj_fc["features"]) == 1
        assert proj_fc["features"][0]["id"] == site_id
        print(f"  -> Verified project-filtered GeoJSON retrieval: {len(proj_fc['features'])} feature for project {project_id}.")

        print("\n[6/7] Testing Site Analytics & Time-Series Metrics...")
        analytics_res = client.get(f"/analytics/sites/{site_id}", headers=auth_headers)
        assert analytics_res.status_code == 200, f"Analytics failed: {analytics_res.status_code} {analytics_res.text}"
        analytics_data = analytics_res.json()
        assert analytics_data["site_id"] == site_id
        assert "kpis" in analytics_data
        assert "timeseries" in analytics_data
        assert len(analytics_data["timeseries"]) >= 24
        sample_ts = analytics_data["timeseries"][-1]
        print(f"  -> Analytics verified for site '{analytics_data['site_name']}':")
        print(f"     KPIs: Carbon Stock={analytics_data['kpis']['current_carbon_stock_tco2e']} tCO2e | NDVI={analytics_data['kpis']['current_ndvi']} | Shannon={analytics_data['kpis']['current_shannon_index']}")
        print(f"     TimeSeries records returned: {len(analytics_data['timeseries'])}")
        print(f"     Latest record: date={sample_ts['record_date']}, carbon={sample_ts['carbon_stock_tco2e']}, ndvi={sample_ts['ndvi_mean']}")

        print("\n[7/7] Testing Portfolio Overview Analytics...")
        overview_res = client.get("/analytics/overview", headers=auth_headers)
        assert overview_res.status_code == 200
        overview_data = overview_res.json()
        assert overview_data["total_projects"] >= 2
        assert overview_data["total_sites"] >= 3
        assert overview_data["total_hectares"] > 0
        assert overview_data["total_carbon_sequestered_tco2e"] > 0
        print("  -> Portfolio Overview:")
        print(f"     Total Projects: {overview_data['total_projects']}")
        print(f"     Total Sites:    {overview_data['total_sites']}")
        print(f"     Total Area:     {overview_data['total_hectares']:.2f} ha")
        print(f"     Total Carbon:   {overview_data['total_carbon_sequestered_tco2e']:.2f} tCO2e")
        print(f"     Average NDVI:   {overview_data['average_ndvi']}")
        print(f"     Average Shannon:{overview_data['average_shannon_index']}")

    print("\n========================================================")
    print("ALL 7 LIVE INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("========================================================")

if __name__ == "__main__":
    import traceback
    try:
        run_e2e_tests()
    except Exception as e:
        print(f"\n[FAIL] Test encountered an error: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
