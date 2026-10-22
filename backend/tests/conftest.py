import pytest
from backend.app import create_app
from backend.app.models.base import db
from backend.app.config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret-key"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(client):
    res = client.post("/api/auth/login", json={
        "identifier": "admin@school.edu.gh",
        "password": "Admin@123"
    })
    data = res.get_json()
    return data["token"]

@pytest.fixture
def teacher_token(client):
    res = client.post("/api/auth/login", json={
        "identifier": "kwame.mensah@school.edu.gh",
        "password": "Teacher@123"
    })
    data = res.get_json()
    return data["token"]

@pytest.fixture
def accountant_token(client):
    res = client.post("/api/auth/login", json={
        "identifier": "accountant@school.edu.gh",
        "password": "Bursar@123"
    })
    data = res.get_json()
    return data["token"]

@pytest.fixture
def student_token(client):
    res = client.post("/api/auth/login", json={
        "identifier": "student.ama@school.edu.gh",
        "password": "Student@123"
    })
    data = res.get_json()
    return data["token"]
