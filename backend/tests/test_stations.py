def test_list_stations(client, sample_station):
    response = client.get("/api/v1/stations")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) >= 1
    assert any(s["code"] == "TEST-ST-01" for s in stations)


def test_search_and_filter_stations(client, sample_station):
    # Search by name
    res = client.get("/api/v1/stations?q=Central")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # Filter by connector
    res = client.get("/api/v1/stations?connector_type=CCS2")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # Filter with non-existent connector
    res = client.get("/api/v1/stations?connector_type=NONEXISTENT")
    assert res.status_code == 200
    assert len(res.json()) == 0


def test_create_station_as_admin(client, admin_headers):
    payload = {
        "name": "New Admin Station",
        "code": "ADM-ST-99",
        "address": "450 Expressway",
        "city": "Chennai",
        "state": "TN",
        "latitude": 13.01,
        "longitude": 80.22,
        "status": "ACTIVE",
        "amenities": "WiFi, Cafe"
    }
    response = client.post("/api/v1/stations", json=payload, headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["code"] == "ADM-ST-99"


def test_create_station_forbidden_as_customer(client, customer_headers):
    payload = {
        "name": "Unauthorized Station",
        "code": "UNAUTH-01",
        "address": "123 Street",
        "city": "Chennai",
        "latitude": 13.0,
        "longitude": 80.0
    }
    response = client.post("/api/v1/stations", json=payload, headers=customer_headers)
    assert response.status_code == 403


def test_delete_station(client, admin_headers, sample_station):
    response = client.delete(f"/api/v1/stations/{sample_station.id}", headers=admin_headers)
    assert response.status_code == 204
