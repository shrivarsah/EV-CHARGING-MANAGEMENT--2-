def test_charging_session_lifecycle(client, customer_headers, sample_station):
    charger = sample_station.chargers[0]
    
    # 1. Start charging session
    start_payload = {
        "charger_id": charger.id,
        "initial_soc": 25.0,
        "target_soc": 85.0
    }
    start_resp = client.post("/api/v1/sessions/start", json=start_payload, headers=customer_headers)
    assert start_resp.status_code == 201
    session_data = start_resp.json()
    session_id = session_data["id"]
    assert session_data["status"] == "ACTIVE"
    assert session_data["current_soc"] == 25.0

    # 2. Try starting another session while one is active (should be rejected)
    dup_resp = client.post("/api/v1/sessions/start", json=start_payload, headers=customer_headers)
    assert dup_resp.status_code == 409

    # 3. Update telemetry progress
    prog_payload = {
        "current_soc": 65.0,
        "energy_consumed_kwh": 22.5,
        "duration_seconds": 1200
    }
    prog_resp = client.patch(f"/api/v1/sessions/{session_id}/progress", json=prog_payload, headers=customer_headers)
    assert prog_resp.status_code == 200
    assert prog_resp.json()["current_soc"] == 65.0
    assert prog_resp.json()["energy_consumed_kwh"] == 22.5

    # 4. Complete session
    complete_payload = {
        "current_soc": 85.0,
        "energy_consumed_kwh": 35.0,
        "duration_seconds": 2100,
        "payment_method": "Credit Card"
    }
    comp_resp = client.post(f"/api/v1/sessions/{session_id}/complete", json=complete_payload, headers=customer_headers)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert comp_data["status"] == "COMPLETED"
    expected_amount = round(35.0 * charger.price_per_kwh, 2)
    assert comp_data["total_amount"] == expected_amount

    # 5. Verify charger is released back to AVAILABLE
    chg_check = client.get(f"/api/v1/chargers/{charger.id}")
    assert chg_check.json()["status"] == "AVAILABLE"

    # 6. Verify payment record was created
    pay_check = client.get("/api/v1/payments", headers=customer_headers)
    assert pay_check.status_code == 200
    payments = pay_check.json()
    assert any(p["session_id"] == session_id and p["amount"] == expected_amount for p in payments)
