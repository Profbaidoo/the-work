def test_list_invoices(client, accountant_token):
    res = client.get("/api/finance/invoices", headers={
        "Authorization": f"Bearer {accountant_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "invoices" in data
    assert len(data["invoices"]) > 0

def test_record_fee_payment(client, accountant_token):
    # Fetch an existing invoice with balance due
    inv_res = client.get("/api/finance/invoices", headers={
        "Authorization": f"Bearer {accountant_token}"
    })
    invoices = inv_res.get_json()["invoices"]
    inv_with_balance = next((i for i in invoices if i["balance_due"] > 0), invoices[0])

    initial_balance = inv_with_balance["balance_due"]
    pay_amount = min(100.0, initial_balance) if initial_balance > 0 else 50.0

    res = client.post("/api/finance/payments", headers={
        "Authorization": f"Bearer {accountant_token}"
    }, json={
        "invoice_id": inv_with_balance["id"],
        "amount": pay_amount,
        "payment_method": "MTN_MOMO",
        "external_transaction_id": "TEST-MOMO-TX-12345",
        "notes": "Automated test payment via Mobile Money"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "RCP-" in data["payment"]["reference_number"]
    assert data["payment"]["amount"] == pay_amount

def test_student_cannot_record_payment(client, student_token):
    res = client.post("/api/finance/payments", headers={
        "Authorization": f"Bearer {student_token}"
    }, json={
        "invoice_id": 1,
        "amount": 100.0
    })
    assert res.status_code == 403
