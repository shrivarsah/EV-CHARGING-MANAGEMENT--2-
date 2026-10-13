def test_list_chargers(client, sample_station):
    response = client.get("/api/v1/chargers")
    assert response.status_code == 200
    chargers = response.json()
    assert len(chargers) >= 2


def test_update_charger_status(client, admin_headers, sample_station):
    charger_id = sample_station.chargers[0].id
    response = client.patch(f"/api/v1/chargers/{charger_id}/status?new_status=MAINTENANCE", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "MAINTENANCE"


def test_update_charger_invalid_status(client, admin_headers, sample_station):
    charger_id = sample_station.chargers[0].id
    response = client.patch(f"/api/v1/chargers/{charger_id}/status?new_status=BROKEN_NOT_VALID", headers=admin_headers)
    assert response.status_code == 400
