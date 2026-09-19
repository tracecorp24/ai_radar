def test_tester_whitelist_management(client):
    # Tester listesine e-posta ekleme ve sorgulama testi
    add_res = client.post(
        "/api/v1/testers/",
        json={"email": "allowed_tester@example.com", "enabled": True}
    )
    assert add_res.status_code == 201

    list_res = client.get("/api/v1/testers/")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
