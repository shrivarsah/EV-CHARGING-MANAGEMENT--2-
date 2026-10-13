import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, UserRole, Station, Charger
from app.auth import get_password_hash, create_access_token

# Test in-memory SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin_user(db_session):
    admin = db_session.query(User).filter(User.email == "test_admin@test.com").first()
    if not admin:
        admin = User(
            email="test_admin@test.com",
            hashed_password=get_password_hash("AdminPass123"),
            full_name="Test Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return admin


@pytest.fixture
def test_customer_user(db_session):
    customer = db_session.query(User).filter(User.email == "test_user@test.com").first()
    if not customer:
        customer = User(
            email="test_user@test.com",
            hashed_password=get_password_hash("UserPass123"),
            full_name="Test Customer",
            role=UserRole.CUSTOMER,
            is_active=True
        )
        db_session.add(customer)
        db_session.commit()
        db_session.refresh(customer)
    return customer


@pytest.fixture
def admin_headers(test_admin_user):
    token = create_access_token(data={"sub": test_admin_user.email, "role": test_admin_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def customer_headers(test_customer_user):
    token = create_access_token(data={"sub": test_customer_user.email, "role": test_customer_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_station(db_session):
    st = Station(
        name="Test Central Station",
        code="TEST-ST-01",
        address="100 Test Blvd",
        city="Chennai",
        state="Tamil Nadu",
        latitude=13.08,
        longitude=80.27,
        status="ACTIVE",
        total_chargers=2
    )
    db_session.add(st)
    db_session.commit()
    db_session.refresh(st)

    c1 = Charger(
        station_id=st.id,
        identifier="CHG-01",
        connector_type="CCS2",
        power_kw=120.0,
        current_type="DC",
        price_per_kwh=19.5,
        status="AVAILABLE"
    )
    c2 = Charger(
        station_id=st.id,
        identifier="CHG-02",
        connector_type="TYPE2",
        power_kw=22.0,
        current_type="AC",
        price_per_kwh=14.0,
        status="AVAILABLE"
    )
    db_session.add_all([c1, c2])
    db_session.commit()
    return st
