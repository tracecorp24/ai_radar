def test_create_user(client):
    response = client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "password": "secretpassword", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "hashed_password" not in data

def test_create_duplicate_user(client):
    client.post(
        "/api/v1/users/",
        json={"email": "duplicate@example.com", "password": "pass", "full_name": "User 1"}
    )
    response = client.post(
        "/api/v1/users/",
        json={"email": "duplicate@example.com", "password": "pass", "full_name": "User 2"}
    )
    assert response.status_code == 400
    assert "zaten kayıtlı" in response.json()["detail"]

def test_list_users(client):
    client.post(
        "/api/v1/users/",
        json={"email": "user1@example.com", "password": "pass"}
    )
    client.post(
        "/api/v1/users/",
        json={"email": "user2@example.com", "password": "pass"}
    )
    response = client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
