import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"


class ChargerStatus(str):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    CHARGING = "CHARGING"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"


class ReservationStatus(str):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"


class SessionStatus(str):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(20), default=UserRole.CUSTOMER, nullable=False)  # ADMIN or CUSTOMER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    reservations = relationship("Reservation", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("ChargingSession", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(500), nullable=False)
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_chargers = Column(Integer, default=1)
    status = Column(String(30), default="ACTIVE")  # ACTIVE, MAINTENANCE, INACTIVE
    amenities = Column(String(500), default="Restrooms, Cafe, Wi-Fi")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    chargers = relationship("Charger", back_populates="station", cascade="all, delete-orphan")


class Charger(Base):
    __tablename__ = "chargers"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False)
    identifier = Column(String(50), nullable=False)  # e.g., "CHG-01"
    connector_type = Column(String(50), nullable=False)  # CCS2, TYPE2, CHADEMO, GBT
    power_kw = Column(Float, nullable=False)  # e.g., 60.0, 120.0, 150.0
    current_type = Column(String(20), default="DC")  # AC, DC
    price_per_kwh = Column(Float, nullable=False, default=18.50)  # Price in currency
    status = Column(String(30), default=ChargerStatus.AVAILABLE)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    station = relationship("Station", back_populates="chargers")
    reservations = relationship("Reservation", back_populates="charger")
    sessions = relationship("ChargingSession", back_populates="charger")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    charger_id = Column(Integer, ForeignKey("chargers.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(30), default=ReservationStatus.CONFIRMED)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reservations")
    charger = relationship("Charger", back_populates="reservations")
    session = relationship("ChargingSession", back_populates="reservation", uselist=False)


class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    charger_id = Column(Integer, ForeignKey("chargers.id", ondelete="CASCADE"), nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="SET NULL"), nullable=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(30), default=SessionStatus.ACTIVE)
    initial_soc = Column(Float, default=20.0)  # Battery State of Charge %
    current_soc = Column(Float, default=20.0)
    target_soc = Column(Float, default=90.0)
    energy_consumed_kwh = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")
    charger = relationship("Charger", back_populates="sessions")
    reservation = relationship("Reservation", back_populates="session")
    payment = relationship("Payment", back_populates="session", uselist=False)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("charging_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    transaction_ref = Column(String(100), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="UPI / Card")
    status = Column(String(30), default="SUCCESS")  # SUCCESS, PENDING, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("ChargingSession", back_populates="payment")
    user = relationship("User", back_populates="payments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="INFO")  # INFO, SUCCESS, WARNING, ALERT
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    overall_score = Column(Float, nullable=False)  # 0 to 100 quality score
    
    # 8 SonarQube Metrics
    loc = Column(Integer, nullable=True)  # Lines of Code
    code_complexity = Column(Integer, nullable=True)  # Cognitive Complexity
    cyclomatic_complexity = Column(Integer, nullable=True)  # Cyclomatic Complexity
    coverage = Column(Float, nullable=True)  # Code Coverage %
    duplication = Column(Float, nullable=True)  # Duplicated Lines %
    bugs = Column(Integer, nullable=True)  # Bugs count
    technical_debt = Column(Integer, nullable=True)  # Debt in minutes
    vulnerabilities = Column(Integer, nullable=True)  # Security Vulnerabilities
    
    # 2 Jira Custom Metrics
    charging_workflow_efficiency = Column(Float, nullable=True)  # (Expected / Actual) * 100
    station_availability_response_index = Column(Float, nullable=True)  # (Expected / Actual) * 100
    
    # Raw JSON and status
    raw_sonarqube_json = Column(Text, nullable=True)
    raw_jira_json = Column(Text, nullable=True)
    status = Column(String(50), default="SUCCESS")  # SUCCESS, PARTIAL, ERROR


class ApiConfiguration(Base):
    __tablename__ = "api_configurations"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String(50), unique=True, index=True, nullable=False)  # "sonarqube" or "jira"
    base_url = Column(String(255), nullable=False)
    project_key = Column(String(100), nullable=False)
    auth_token = Column(String(500), nullable=True)
    username_or_email = Column(String(255), nullable=True)
    organization = Column(String(100), nullable=True)
    custom_fields_json = Column(Text, nullable=True)  # JSON mapping for custom fields
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
