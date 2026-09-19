from app.services.ai.factory import LLMFactory

def test_llm_factory():
    mock_provider = LLMFactory.get_provider("mock")
    response = mock_provider.generate("Merhaba AI")
    assert "[MOCK AI" in response
    assert "Merhaba AI" in response

def test_ai_generate_endpoint(client):
    # 1. Kullanıcı kaydet ve token al
    reg_res = client.post(
        "/api/v1/users/",
        json={"email": "ai_user@example.com", "password": "password123"}
    )
    assert reg_res.status_code == 201

    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "ai_user@example.com", "password": "password123"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Mock provider ile AI üretimi isteği gönder
    ai_res = client.post(
        "/api/v1/ai/generate",
        headers=headers,
        json={
            "prompt": "Bana vendor bağımsız mimariyi anlat",
            "provider": "mock",
            "model_name": "mock-test-model"
        }
    )
    assert ai_res.status_code == 200
    data = ai_res.json()
    assert data["status"] == "completed"
    assert data["provider"] == "mock"
    assert "[MOCK AI" in data["response"]
    assert "Bana vendor bağımsız mimariyi anlat" in data["response"]
