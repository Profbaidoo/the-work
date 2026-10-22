def test_list_assessments(client, teacher_token):
    res = client.get("/api/assessments?class_id=9", headers={
        "Authorization": f"Bearer {teacher_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "assessments" in data

def test_grading_scale_retrieval(client, admin_token):
    res = client.get("/api/assessments/grading-scale", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "grading_scale" in data
    assert len(data["grading_scale"]) >= 9 # Ghanaian 9-point scale

def test_report_card_generation(client, teacher_token):
    res = client.post("/api/report-cards/generate-class", headers={
        "Authorization": f"Bearer {teacher_token}"
    }, json={
        "class_id": 9,
        "term_id": 2
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "Successfully generated" in data["message"]
