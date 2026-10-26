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

def test_user_self_registration(client):
    res = client.post("/api/auth/register", json={
        "full_name": "Madam Akosua Mensah",
        "username": "akosua.mensah",
        "email": "akosua.mensah@gmail.com",
        "phone": "+233 256331492",
        "password": "Password@123",
        "role": "parent",
        "residential_address": "House 10, Achimota, Accra"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "token" in data
    assert data["user"]["username"] == "akosua.mensah"
    assert data["user"]["role_name"] == "parent"

def test_2fa_qr_setup(client, admin_token):
    res = client.get("/api/auth/2fa/qr-setup", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "secret" in data
    assert "qr_image_url" in data
    assert "otpauth_uri" in data

def test_database_backup_api(client, admin_token):
    # Test backup creation
    res = client.post("/api/settings/backups/create", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "backup" in data
    assert "charity_prep_backup" in data["backup"]["filename"]
    assert "checksum_sha256" in data["backup"]

    # Test listing backups
    list_res = client.get("/api/settings/backups", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert list_res.status_code == 200
    backups = list_res.get_json()["backups"]
    assert len(backups) >= 1

def test_mandatory_2fa_login_and_verify(client):
    # Step 1: Login with credentials returns 2FA requirement and QR code
    res = client.post("/api/auth/login", json={
        "identifier": "admin@school.edu.gh",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["two_factor_required"] is True
    assert "temp_token" in data
    assert "qr_image_url" in data
    assert "secret" in data
    temp_token = data["temp_token"]

    # Step 2: Verify 6-digit phone code to receive access token
    verify_res = client.post("/api/auth/login/2fa-verify", json={
        "code": "123456"
    }, headers={
        "Authorization": f"Bearer {temp_token}"
    })
    assert verify_res.status_code == 200
    verify_data = verify_res.get_json()
    assert "token" in verify_data
    assert verify_data["user"]["role_name"] == "super_admin"

def test_direct_qr_otp_login(client):
    res = client.post("/api/auth/login/qr-otp", json={
        "identifier": "admin@school.edu.gh",
        "code": "123456"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert data["user"]["email"] == "admin@school.edu.gh"
