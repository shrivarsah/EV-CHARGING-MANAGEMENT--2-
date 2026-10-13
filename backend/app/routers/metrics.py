from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ApiConfiguration, MetricSnapshot, User
from app.schemas import (
    QualityOverview, MetricSnapshotOut, ApiConfigCreate,
    ApiConfigOut, TestConnectionRequest, TestConnectionResponse
)
from app.services.metrics_service import MetricsService
from app.services.sonarqube_service import SonarQubeService
from app.services.jira_service import JiraService
from app.auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["Software & Jira Metrics"])


@router.get("/overview", response_model=QualityOverview)
def get_metrics_overview(
    db: Session = Depends(get_db)
):
    """
    Returns the real-time software metrics overview containing exactly 10 metrics:
    - 8 SonarQube metrics
    - 2 Jira custom metrics
    Zero hardcoded fake metrics.
    """
    return MetricsService.fetch_all_metrics(db=db, save_snapshot=False)


@router.post("/refresh", response_model=QualityOverview)
def refresh_and_snapshot_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers an immediate re-fetch from SonarQube Cloud and Jira Cloud,
    recording a new historical snapshot in the database.
    """
    return MetricsService.fetch_all_metrics(db=db, save_snapshot=True)


@router.get("/trends", response_model=List[MetricSnapshotOut])
def get_historical_trends(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns chronological metric snapshots for historical trend charts.
    """
    snapshots = db.query(MetricSnapshot).order_by(
        MetricSnapshot.timestamp.asc()
    ).limit(limit).all()
    return snapshots


@router.get("/config", response_model=List[ApiConfigOut])
def get_api_configurations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns stored API credentials & integration settings.
    Tokens are masked for security.
    """
    configs = db.query(ApiConfiguration).all()
    masked = []
    for c in configs:
        item = ApiConfigOut(
            id=c.id,
            service_name=c.service_name,
            base_url=c.base_url,
            project_key=c.project_key,
            auth_token="••••••••" if c.auth_token else None,
            username_or_email=c.username_or_email,
            organization=c.organization,
            custom_fields_json=c.custom_fields_json,
            is_active=c.is_active,
            updated_at=c.updated_at
        )
        masked.append(item)
    return masked


@router.post("/config", response_model=ApiConfigOut)
def save_api_configuration(
    cfg_in: ApiConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saves or updates SonarQube or Jira integration settings.
    """
    service = cfg_in.service_name.lower().strip()
    if service not in ["sonarqube", "jira"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="service_name must be 'sonarqube' or 'jira'."
        )

    existing = db.query(ApiConfiguration).filter(
        ApiConfiguration.service_name == service
    ).first()

    if existing:
        existing.base_url = cfg_in.base_url
        existing.project_key = cfg_in.project_key
        # Only overwrite auth_token if provided and not masked
        if cfg_in.auth_token and not cfg_in.auth_token.startswith("••"):
            existing.auth_token = cfg_in.auth_token
        existing.username_or_email = cfg_in.username_or_email
        existing.organization = cfg_in.organization
        existing.custom_fields_json = cfg_in.custom_fields_json
        existing.is_active = cfg_in.is_active
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_cfg = ApiConfiguration(
            service_name=service,
            base_url=cfg_in.base_url,
            project_key=cfg_in.project_key,
            auth_token=cfg_in.auth_token,
            username_or_email=cfg_in.username_or_email,
            organization=cfg_in.organization,
            custom_fields_json=cfg_in.custom_fields_json,
            is_active=cfg_in.is_active
        )
        db.add(new_cfg)
        db.commit()
        db.refresh(new_cfg)
        return new_cfg


@router.post("/test-connection", response_model=TestConnectionResponse)
def test_connection(
    req: TestConnectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validates connectivity to SonarQube or Jira without persisting settings.
    """
    service = req.service_name.lower().strip()
    
    # If token was masked, retrieve existing token from DB
    auth_token = req.auth_token
    if auth_token and auth_token.startswith("••"):
        existing = db.query(ApiConfiguration).filter(ApiConfiguration.service_name == service).first()
        auth_token = existing.auth_token if existing else None

    if service == "sonarqube":
        success, msg, details = SonarQubeService.test_connection(
            base_url=req.base_url,
            project_key=req.project_key,
            token=auth_token
        )
        return TestConnectionResponse(
            success=success,
            service="SonarQube Cloud",
            message=msg,
            details=details
        )
    elif service == "jira":
        success, msg, details = JiraService.test_connection(
            base_url=req.base_url,
            project_key=req.project_key,
            email=req.username_or_email or "",
            api_token=auth_token or ""
        )
        return TestConnectionResponse(
            success=success,
            service="Jira Cloud",
            message=msg,
            details=details
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown service_name. Expected 'sonarqube' or 'jira'."
        )
