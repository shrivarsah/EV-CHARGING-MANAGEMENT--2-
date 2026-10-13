def test_register_user_success(client):
    payload = {
        "email": "newuser@test.com",
        "password": "Password123!",
        "full_name": "New User",
        "phone": "+1234567890",
        "role": "CUSTOMER"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New User"
    assert "id" in data


def test_register_duplicate_email(client, test_customer_user):
    payload = {
        "email": test_customer_user.email,
        "password": "SomeOtherPassword123",
        "full_name": "Duplicate Tester"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_success(client, test_customer_user):
    payload = {
        "email": test_customer_user.email,
        "password": "UserPass123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_customer_user.email


def test_login_invalid_password(client, test_customer_user):
    payload = {
        "email": test_customer_user.email,
        "password": "WrongPassword"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_read_me_endpoint(client, customer_headers):
    response = client.get("/api/v1/auth/me", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_user@test.com"
