import datetime
import logging
from sqlalchemy.orm import Session

from app.models import (
    User, UserRole, Station, Charger, ChargerStatus,
    Reservation, ReservationStatus, ChargingSession, SessionStatus,
    Payment, Notification, ApiConfiguration
)
from app.auth import get_password_hash
from app.config import settings

logger = logging.getLogger(__name__)


def seed_database(db: Session):
    """
    Seeds initial realistic data ONLY for EV charging application entities.
    Never creates synthetic or fake SonarQube/Jira metrics.
    """
    # Check if data already exists
    user_count = db.query(User).count()
    if user_count > 0:
        logger.info("Database already seeded. Skipping initial data injection.")
        return

    logger.info("Seeding EV Charging application data...")

    # 1. Create Default Users
    admin_user = User(
        email="admin@evcharging.com",
        hashed_password=get_password_hash("Admin@12345"),
        full_name="System Administrator",
        phone="+91 98400 11223",
        role=UserRole.ADMIN,
        is_active=True
    )
    customer_user = User(
        email="customer@evcharging.com",
        hashed_password=get_password_hash("Customer@12345"),
        full_name="Alex Mercer",
        phone="+91 98765 43210",
        role=UserRole.CUSTOMER,
        is_active=True
    )
    db.add_all([admin_user, customer_user])
    db.commit()
    db.refresh(admin_user)
    db.refresh(customer_user)

    # 2. Create Realistic EV Charging Stations
    stations_data = [
        {
            "name": "Chennai Central EV Hub",
            "code": "CHE-CEN-01",
            "address": "Grand Southern Trunk Rd, Park Town",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "status": "ACTIVE",
            "amenities": "24/7 Access, Lounge, Coffee Shop, High-Speed Wi-Fi, Restrooms",
            "chargers": [
                {"identifier": "CEN-DC-01", "connector_type": "CCS2", "power_kw": 150.0, "current_type": "DC", "price_per_kwh": 21.0, "status": "AVAILABLE"},
                {"identifier": "CEN-DC-02", "connector_type": "CCS2", "power_kw": 120.0, "current_type": "DC", "price_per_kwh": 19.5, "status": "AVAILABLE"},
                {"identifier": "CEN-DC-03", "connector_type": "CHAdeMO", "power_kw": 50.0, "current_type": "DC", "price_per_kwh": 17.5, "status": "CHARGING"},
                {"identifier": "CEN-AC-04", "connector_type": "TYPE2", "power_kw": 22.0, "current_type": "AC", "price_per_kwh": 14.0, "status": "AVAILABLE"},
            ]
        },
        {
            "name": "OMR IT Corridor Supercharger",
            "code": "CHE-OMR-02",
            "address": "Rajiv Gandhi Salai, Sholinganallur Tech Park",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "latitude": 12.9010,
            "longitude": 80.2279,
            "status": "ACTIVE",
            "amenities": "Food Court, EV Valet, Covered Canopy, CCTV Surveillance",
            "chargers": [
                {"identifier": "OMR-DC-01", "connector_type": "CCS2", "power_kw": 180.0, "current_type": "DC", "price_per_kwh": 22.0, "status": "AVAILABLE"},
                {"identifier": "OMR-DC-02", "connector_type": "CCS2", "power_kw": 120.0, "current_type": "DC", "price_per_kwh": 19.5, "status": "AVAILABLE"},
                {"identifier": "OMR-AC-03", "connector_type": "TYPE2", "power_kw": 22.0, "current_type": "AC", "price_per_kwh": 14.0, "status": "RESERVED"},
            ]
        },
        {
            "name": "Airport Terminal 2 Express Hub",
            "code": "CHE-AIR-03",
            "address": "Meenambakkam International Airport Road",
            "city": "Chennai Airport",
            "state": "Tamil Nadu",
            "latitude": 12.9941,
            "longitude": 80.1709,
            "status": "ACTIVE",
            "amenities": "Flight Information Display, Premium Lounge, Restrooms, 24/7 Security",
            "chargers": [
                {"identifier": "AIR-DC-01", "connector_type": "CCS2", "power_kw": 240.0, "current_type": "DC", "price_per_kwh": 24.0, "status": "AVAILABLE"},
                {"identifier": "AIR-DC-02", "connector_type": "CCS2", "power_kw": 150.0, "current_type": "DC", "price_per_kwh": 21.0, "status": "CHARGING"},
                {"identifier": "AIR-DC-03", "connector_type": "CHAdeMO", "power_kw": 60.0, "current_type": "DC", "price_per_kwh": 18.0, "status": "AVAILABLE"},
            ]
        },
        {
            "name": "Anna Nagar EcoCharge Plaza",
            "code": "CHE-ANN-04",
            "address": "2nd Avenue, Near Anna Nagar Tower Park",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "latitude": 13.0850,
            "longitude": 80.2101,
            "status": "ACTIVE",
            "amenities": "Solar Canopy, Convenience Store, Air & Water Refill, Restrooms",
            "chargers": [
                {"identifier": "ANN-DC-01", "connector_type": "CCS2", "power_kw": 60.0, "current_type": "DC", "price_per_kwh": 18.5, "status": "AVAILABLE"},
                {"identifier": "ANN-AC-02", "connector_type": "TYPE2", "power_kw": 22.0, "current_type": "AC", "price_per_kwh": 13.5, "status": "AVAILABLE"},
                {"identifier": "ANN-AC-03", "connector_type": "TYPE2", "power_kw": 11.0, "current_type": "AC", "price_per_kwh": 12.0, "status": "MAINTENANCE"},
            ]
        },
        {
            "name": "Bangalore Highway Fast Charging Plaza",
            "code": "CHE-BLR-05",
            "address": "NH 48, Sriperumbudur Industrial Hub",
            "city": "Sriperumbudur",
            "state": "Tamil Nadu",
            "latitude": 12.9734,
            "longitude": 79.9482,
            "status": "ACTIVE",
            "amenities": "Highway Motel, Truck & Bus Charging Bays, Restaurant, Kid Play Area",
            "chargers": [
                {"identifier": "BLR-DC-01", "connector_type": "CCS2", "power_kw": 350.0, "current_type": "DC", "price_per_kwh": 25.0, "status": "AVAILABLE"},
                {"identifier": "BLR-DC-02", "connector_type": "CCS2", "power_kw": 180.0, "current_type": "DC", "price_per_kwh": 22.0, "status": "AVAILABLE"},
            ]
        }
    ]

    all_chargers = []
    for s_data in stations_data:
        chargers_list = s_data.pop("chargers")
        station = Station(**s_data, total_chargers=len(chargers_list))
        db.add(station)
        db.commit()
        db.refresh(station)

        for c_data in chargers_list:
            charger = Charger(station_id=station.id, **c_data)
            db.add(charger)
            all_chargers.append(charger)

    db.commit()

    # 3. Create Sample Historical Sessions & Payments for the Customer
    target_charger = all_chargers[0]
    past_time_1 = datetime.datetime.utcnow() - datetime.timedelta(days=2, hours=4)
    session_1 = ChargingSession(
        user_id=customer_user.id,
        charger_id=target_charger.id,
        start_time=past_time_1,
        end_time=past_time_1 + datetime.timedelta(minutes=42),
        status=SessionStatus.COMPLETED,
        initial_soc=18.0,
        current_soc=88.0,
        target_soc=90.0,
        energy_consumed_kwh=38.4,
        duration_seconds=2520,
        total_amount=round(38.4 * target_charger.price_per_kwh, 2)
    )
    db.add(session_1)
    db.commit()
    db.refresh(session_1)

    payment_1 = Payment(
        session_id=session_1.id,
        user_id=customer_user.id,
        transaction_ref="TXN-EVC-982103",
        amount=session_1.total_amount,
        payment_method="UPI AutoPay",
        status="SUCCESS",
        created_at=session_1.end_time
    )
    db.add(payment_1)

    # 4. Create Sample Notifications
    notifs = [
        Notification(
            user_id=customer_user.id,
            title="Welcome to EV ChargePoint Network",
            message="Your account has been activated. Explore high-speed charging hubs and reserve slots with real-time telemetry.",
            type="INFO",
            is_read=True
        ),
        Notification(
            user_id=customer_user.id,
            title="Invoice Paid Successfully",
            message=f"Payment of ₹{session_1.total_amount:.2f} for charging session #{session_1.id} was processed.",
            type="SUCCESS",
            is_read=False
        )
    ]
    db.add_all(notifs)

    # 5. Seed default API configurations if environment settings exist
    if settings.SONARQUBE_PROJECT_KEY:
        sonar_cfg = ApiConfiguration(
            service_name="sonarqube",
            base_url=settings.SONARQUBE_URL,
            project_key=settings.SONARQUBE_PROJECT_KEY,
            auth_token=settings.SONARQUBE_TOKEN or None,
            organization=settings.SONARQUBE_ORGANIZATION or None,
            is_active=True
        )
        db.add(sonar_cfg)

    if settings.JIRA_PROJECT_KEY:
        jira_cfg = ApiConfiguration(
            service_name="jira",
            base_url=settings.JIRA_URL or "https://your-domain.atlassian.net",
            project_key=settings.JIRA_PROJECT_KEY,
            username_or_email=settings.JIRA_EMAIL or None,
            auth_token=settings.JIRA_API_TOKEN or None,
            is_active=True
        )
        db.add(jira_cfg)

    db.commit()
    logger.info("EV Charging application seed completed successfully.")
