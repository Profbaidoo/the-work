def test_login_success(client):
    res = client.post("/api/auth/login", json={
        "identifier": "admin@school.edu.gh",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert data["user"]["role_name"] == "super_admin"

def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "identifier": "admin@school.edu.gh",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "error" in res.get_json()

def test_get_me_endpoint(client, admin_token):
    res = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["email"] == "admin@school.edu.gh"
