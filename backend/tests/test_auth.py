def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_register_user_success(client):
    payload = {
        "email": "newuser@darukaa.earth",
        "password": "SecretPassword123!",
        "full_name": "New Ranger",
        "role": "admin",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@darukaa.earth"


def test_register_duplicate_email_fails(client):
    payload = {
        "email": "duplicate@darukaa.earth",
        "password": "Password123!",
        "full_name": "First User",
    }
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


def test_login_success(client, test_user):
    login_data = {"email": test_user.email, "password": "Password123!"}
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_user.email


def test_login_invalid_password_fails(client, test_user):
    login_data = {"email": test_user.email, "password": "WrongPassword!"}
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401


def test_get_current_user_me(client, auth_headers, test_user):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name


def test_protected_route_without_token_fails(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
