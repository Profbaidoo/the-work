def test_list_students(client, admin_token):
    res = client.get("/api/students", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "students" in data
    assert len(data["students"]) > 0

def test_register_student(client, admin_token):
    res = client.post("/api/students", headers={
        "Authorization": f"Bearer {admin_token}"
    }, json={
        "first_name": "Kojo",
        "last_name": "Acheampong",
        "other_names": "Kwaku",
        "gender": "Male",
        "date_of_birth": "2016-05-14",
        "current_class_id": 1,
        "residential_address": "Achimota Forest Rd, Accra",
        "guardian_name": "Dr. Yaw Acheampong",
        "guardian_phone": "+233 24 555 1234",
        "guardian_relationship": "Father"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "student" in data
    assert data["student"]["first_name"] == "Kojo"
    assert "SCH/" in data["student"]["admission_number"]

def test_student_role_cannot_register_student(client, student_token):
    res = client.post("/api/students", headers={
        "Authorization": f"Bearer {student_token}"
    }, json={
        "first_name": "Hacker",
        "last_name": "Unauthorized",
        "gender": "Male",
        "date_of_birth": "2015-01-01",
        "current_class_id": 1
    })
    assert res.status_code == 403
