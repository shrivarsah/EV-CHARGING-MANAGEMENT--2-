from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Charger, Station, User
from app.schemas import ChargerOut, ChargerCreate, ChargerUpdate
from app.auth import get_current_admin, get_current_user

router = APIRouter(prefix="/chargers", tags=["Chargers"])


@router.get("", response_model=List[ChargerOut])
def list_chargers(
    station_id: Optional[int] = Query(None, description="Filter by station ID"),
    status: Optional[str] = Query(None, description="Filter by charger status"),
    connector_type: Optional[str] = Query(None, description="Filter by connector type"),
    db: Session = Depends(get_db)
):
    query = db.query(Charger)
    if station_id:
        query = query.filter(Charger.station_id == station_id)
    if status:
        query = query.filter(Charger.status == status)
    if connector_type:
        query = query.filter(Charger.connector_type.ilike(connector_type))
    return query.all()


@router.get("/{charger_id}", response_model=ChargerOut)
def get_charger(charger_id: int, db: Session = Depends(get_db)):
    charger = db.query(Charger).filter(Charger.id == charger_id).first()
    if not charger:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charger not found")
    return charger


@router.post("", response_model=ChargerOut, status_code=status.HTTP_201_CREATED)
def create_charger(
    charger_in: ChargerCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    station = db.query(Station).filter(Station.id == charger_in.station_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    charger = Charger(**charger_in.model_dump())
    db.add(charger)
    station.total_chargers = len(station.chargers) + 1
    db.commit()
    db.refresh(charger)
    return charger


@router.patch("/{charger_id}/status", response_model=ChargerOut)
def update_charger_status(
    charger_id: int,
    new_status: str = Query(..., description="Target status (AVAILABLE, CHARGING, MAINTENANCE, OFFLINE)"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    charger = db.query(Charger).filter(Charger.id == charger_id).first()
    if not charger:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charger not found")

    valid_statuses = ["AVAILABLE", "RESERVED", "CHARGING", "MAINTENANCE", "OFFLINE"]
    if new_status.upper() not in valid_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Must be one of {valid_statuses}")

    charger.status = new_status.upper()
    db.commit()
    db.refresh(charger)
    return charger


@router.delete("/{charger_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_charger(
    charger_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    charger = db.query(Charger).filter(Charger.id == charger_id).first()
    if not charger:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charger not found")

    station = charger.station
    db.delete(charger)
    if station:
        station.total_chargers = max(0, len(station.chargers) - 1)
    db.commit()
    return None
