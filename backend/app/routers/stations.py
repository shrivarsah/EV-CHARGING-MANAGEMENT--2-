from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Station, Charger, ChargerStatus, User
from app.schemas import StationOut, StationCreate, StationUpdate
from app.auth import get_current_admin

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.get("", response_model=List[StationOut])
def list_stations(
    q: Optional[str] = Query(None, description="Search query by station name, code, or address"),
    city: Optional[str] = Query(None, description="Filter by city"),
    status: Optional[str] = Query(None, description="Filter by station status (ACTIVE, MAINTENANCE, INACTIVE)"),
    connector_type: Optional[str] = Query(None, description="Filter by available connector type"),
    min_power_kw: Optional[float] = Query(None, description="Filter by minimum charger power"),
    available_only: bool = Query(False, description="Filter stations with at least one available charger"),
    db: Session = Depends(get_db)
):
    query = db.query(Station)

    if q:
        query = query.filter(
            or_(
                Station.name.ilike(f"%{q}%"),
                Station.code.ilike(f"%{q}%"),
                Station.address.ilike(f"%{q}%"),
                Station.city.ilike(f"%{q}%")
            )
        )
    if city:
        query = query.filter(Station.city.ilike(f"%{city}%"))
    if status:
        query = query.filter(Station.status == status)

    stations = query.all()

    # Filter in-memory for connector_type, min_power_kw, available_only if needed
    if connector_type or min_power_kw is not None or available_only:
        filtered = []
        for st in stations:
            chargers = st.chargers
            matched = True
            if connector_type:
                if not any(c.connector_type.upper() == connector_type.upper() for c in chargers):
                    matched = False
            if min_power_kw is not None:
                if not any(c.power_kw >= min_power_kw for c in chargers):
                    matched = False
            if available_only:
                if not any(c.status == ChargerStatus.AVAILABLE for c in chargers):
                    matched = False
            if matched:
                filtered.append(st)
        return filtered

    return stations


@router.get("/{station_id}", response_model=StationOut)
def get_station(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    return station


@router.post("", response_model=StationOut, status_code=status.HTTP_201_CREATED)
def create_station(
    station_in: StationCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    existing = db.query(Station).filter(Station.code == station_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Station with code '{station_in.code}' already exists."
        )

    station = Station(**station_in.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station


@router.put("/{station_id}", response_model=StationOut)
def update_station(
    station_id: int,
    station_in: StationUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    update_data = station_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(station, field, value)

    db.commit()
    db.refresh(station)
    return station


@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_station(
    station_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    db.delete(station)
    db.commit()
    return None
