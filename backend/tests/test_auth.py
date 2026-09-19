def test_login_and_get_me(client):
    # 1. Kullanıcı Oluştur
    reg_res = client.post(
        "/api/v1/users/",
        json={"email": "auth_test@example.com", "password": "mypassword123", "full_name": "Auth User"}
    )
    assert reg_res.status_code == 201

    # 2. Login ol ve Token al (OAuth2 form-data)
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "auth_test@example.com", "password": "mypassword123"}
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    token = token_data["access_token"]

    # 3. Korumalı /me endpoint'ine isteği token ile gönder
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_profile = me_res.json()
    assert user_profile["email"] == "auth_test@example.com"
    assert user_profile["full_name"] == "Auth User"

def test_login_invalid_password(client):
    client.post(
        "/api/v1/users/",
        json={"email": "wrong_pass@example.com", "password": "correctpassword"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "wrong_pass@example.com", "password": "wrongpassword"}
    )
    assert login_res.status_code == 401
    assert "Hatalı" in login_res.json()["detail"]
