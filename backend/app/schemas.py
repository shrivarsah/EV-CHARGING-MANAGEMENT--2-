import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field


# ==================== User & Auth Schemas ====================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str = "CUSTOMER"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# ==================== Charger Schemas ====================
class ChargerBase(BaseModel):
    identifier: str
    connector_type: str
    power_kw: float
    current_type: str = "DC"
    price_per_kwh: float = 18.50
    status: str = "AVAILABLE"


class ChargerCreate(ChargerBase):
    station_id: int


class ChargerUpdate(BaseModel):
    identifier: Optional[str] = None
    connector_type: Optional[str] = None
    power_kw: Optional[float] = None
    current_type: Optional[str] = None
    price_per_kwh: Optional[float] = None
    status: Optional[str] = None


class ChargerOut(ChargerBase):
    id: int
    station_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# ==================== Station Schemas ====================
class StationBase(BaseModel):
    name: str
    code: str
    address: str
    city: str
    state: Optional[str] = None
    latitude: float
    longitude: float
    status: str = "ACTIVE"
    amenities: Optional[str] = "Restrooms, Cafe, Wi-Fi"


class StationCreate(StationBase):
    pass


class StationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    amenities: Optional[str] = None


class StationOut(StationBase):
    id: int
    total_chargers: int
    created_at: datetime.datetime
    chargers: List[ChargerOut] = []

    class Config:
        from_attributes = True


# ==================== Reservation Schemas ====================
class ReservationCreate(BaseModel):
    charger_id: int
    start_time: datetime.datetime
    end_time: datetime.datetime
    notes: Optional[str] = None


class ReservationOut(BaseModel):
    id: int
    user_id: int
    charger_id: int
    start_time: datetime.datetime
    end_time: datetime.datetime
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    charger: Optional[ChargerOut] = None

    class Config:
        from_attributes = True


# ==================== Charging Session Schemas ====================
class SessionCreate(BaseModel):
    charger_id: int
    reservation_id: Optional[int] = None
    initial_soc: float = 20.0
    target_soc: float = 90.0


class SessionUpdateProgress(BaseModel):
    current_soc: float
    energy_consumed_kwh: float
    duration_seconds: int


class SessionComplete(BaseModel):
    current_soc: float = 90.0
    energy_consumed_kwh: float
    duration_seconds: int
    payment_method: str = "UPI / Card"


class SessionOut(BaseModel):
    id: int
    user_id: int
    charger_id: int
    reservation_id: Optional[int] = None
    start_time: datetime.datetime
    end_time: Optional[datetime.datetime] = None
    status: str
    initial_soc: float
    current_soc: float
    target_soc: float
    energy_consumed_kwh: float
    duration_seconds: int
    total_amount: float
    created_at: datetime.datetime
    charger: Optional[ChargerOut] = None

    class Config:
        from_attributes = True


# ==================== Payment Schemas ====================
class PaymentOut(BaseModel):
    id: int
    session_id: int
    user_id: int
    transaction_ref: str
    amount: float
    payment_method: str
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==================== Notification Schemas ====================
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==================== Metrics Schemas ====================
class MetricItem(BaseModel):
    id: str
    name: str
    category: str  # "Code Quality", "Testing & Security", "EV Operation"
    source: str  # "SonarQube Cloud" or "Jira Cloud"
    value: Optional[float] = None
    formatted_value: str
    unit: str
    description: str
    status: str  # "GOOD", "WARNING", "DANGER", "UNCONFIGURED"
    benchmark: str
    formula: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class QualityOverview(BaseModel):
    overall_score: float
    status_label: str  # "A (Excellent)", "B (Good)", etc.
    total_metrics: int = 10
    configured_metrics: int
    sonarqube_status: str  # "CONNECTED", "NOT_CONFIGURED", "ERROR"
    jira_status: str  # "CONNECTED", "NOT_CONFIGURED", "ERROR"
    last_updated: Optional[datetime.datetime] = None
    metrics: List[MetricItem]
    project_health_summary: str


class MetricSnapshotOut(BaseModel):
    id: int
    timestamp: datetime.datetime
    overall_score: float
    loc: Optional[int] = None
    code_complexity: Optional[int] = None
    cyclomatic_complexity: Optional[int] = None
    coverage: Optional[float] = None
    duplication: Optional[float] = None
    bugs: Optional[int] = None
    technical_debt: Optional[int] = None
    vulnerabilities: Optional[int] = None
    charging_workflow_efficiency: Optional[float] = None
    station_availability_response_index: Optional[float] = None
    status: str

    class Config:
        from_attributes = True


class ApiConfigBase(BaseModel):
    service_name: str  # "sonarqube" or "jira"
    base_url: str
    project_key: str
    auth_token: Optional[str] = None
    username_or_email: Optional[str] = None
    organization: Optional[str] = None
    custom_fields_json: Optional[str] = None
    is_active: bool = True


class ApiConfigCreate(ApiConfigBase):
    pass


class ApiConfigOut(ApiConfigBase):
    id: int
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class TestConnectionRequest(BaseModel):
    service_name: str
    base_url: str
    project_key: str
    auth_token: Optional[str] = None
    username_or_email: Optional[str] = None
    organization: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    service: str
    message: str
    details: Optional[Dict[str, Any]] = None


class AdminStatsOut(BaseModel):
    total_stations: int
    total_chargers: int
    available_chargers: int
    active_sessions: int
    total_energy_kwh: float
    total_revenue: float
    utilization_rate: float
