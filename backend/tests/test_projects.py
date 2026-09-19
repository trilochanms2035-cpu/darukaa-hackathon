def test_create_and_get_project(client, auth_headers):
    payload = {
        "title": "Cerrado Biome Restoration Project",
        "description": "Native savannah reforestation in central Brazil.",
        "project_type": "reforestation",
        "standard": "Verra VCS",
        "status": "active",
        "country": "Brazil",
    }
    response = client.post(
        "/api/v1/projects/", json=payload, headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["country"] == "Brazil"
    project_id = data["id"]

    # Retrieve single project
    get_res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    # List projects
    list_res = client.get("/api/v1/projects/", headers=auth_headers)
    assert list_res.status_code == 200
    assert any(p["id"] == project_id for p in list_res.json())


def test_update_project(client, auth_headers):
    # Create project
    create_res = client.post(
        "/api/v1/projects/",
        json={"title": "Original Title", "country": "Kenya"},
        headers=auth_headers,
    )
    project_id = create_res.json()["id"]

    # Update title
    update_res = client.put(
        f"/api/v1/projects/{project_id}",
        json={"title": "Updated Title", "status": "completed"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"
    assert update_res.json()["status"] == "completed"


def test_delete_project(client, auth_headers):
    create_res = client.post(
        "/api/v1/projects/",
        json={"title": "Temporary Project", "country": "Uganda"},
        headers=auth_headers,
    )
    project_id = create_res.json()["id"]

    del_res = client.delete(
        f"/api/v1/projects/{project_id}", headers=auth_headers
    )
    assert del_res.status_code == 204

    # Verify 404
    get_res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_res.status_code == 404
