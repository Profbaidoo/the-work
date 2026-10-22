def test_get_class_register(client, teacher_token):
    res = client.get("/api/attendance/register?class_id=9&date=2026-03-01", headers={
        "Authorization": f"Bearer {teacher_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "register" in data
    assert len(data["register"]) > 0

def test_bulk_attendance_save(client, teacher_token):
    # Fetch register to get a student ID
    reg_res = client.get("/api/attendance/register?class_id=9&date=2026-03-02", headers={
        "Authorization": f"Bearer {teacher_token}"
    })
    register = reg_res.get_json()["register"]
    student_id = register[0]["student_id"]

    res = client.post("/api/attendance/bulk", headers={
        "Authorization": f"Bearer {teacher_token}"
    }, json={
        "class_id": 9,
        "date": "2026-03-02",
        "entries": [
            {"student_id": student_id, "status": "PRESENT", "reason": "", "parent_notified": False}
        ]
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "Successfully saved" in data["message"]
