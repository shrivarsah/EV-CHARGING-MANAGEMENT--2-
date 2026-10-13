import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Reservation, Charger, ChargerStatus, ReservationStatus, User, UserRole, Notification
from app.schemas import ReservationOut, ReservationCreate
from app.auth import get_current_user

router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    res_in: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    charger = db.query(Charger).filter(Charger.id == res_in.charger_id).first()
    if not charger:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charger not found")

    if charger.status != ChargerStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Charger is currently '{charger.status}' and cannot be reserved."
        )

    # Check time validity
    if res_in.end_time <= res_in.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation end time must be after start time."
        )

    reservation = Reservation(
        user_id=current_user.id,
        charger_id=charger.id,
        start_time=res_in.start_time,
        end_time=res_in.end_time,
        status=ReservationStatus.CONFIRMED,
        notes=res_in.notes
    )
    charger.status = ChargerStatus.RESERVED
    db.add(reservation)

    # Add notification for the user
    notification = Notification(
        user_id=current_user.id,
        title="Reservation Confirmed",
        message=f"Your charging slot at {charger.station.name} ({charger.identifier}) has been reserved for {res_in.start_time.strftime('%b %d, %H:%M')}.",
        type="SUCCESS"
    )
    db.add(notification)

    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("", response_model=List[ReservationOut])
def list_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Reservation).order_by(Reservation.created_at.desc())
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Reservation.user_id == current_user.id)
    return query.all()


@router.get("/{res_id}", response_model=ReservationOut)
def get_reservation(
    res_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = db.query(Reservation).filter(Reservation.id == res_id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    if current_user.role != UserRole.ADMIN and res.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return res


@router.patch("/{res_id}/cancel", response_model=ReservationOut)
def cancel_reservation(
    res_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = db.query(Reservation).filter(Reservation.id == res_id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    if current_user.role != UserRole.ADMIN and res.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if res.status in [ReservationStatus.CANCELLED, ReservationStatus.COMPLETED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Reservation is already {res.status}")

    res.status = ReservationStatus.CANCELLED
    if res.charger and res.charger.status == ChargerStatus.RESERVED:
        res.charger.status = ChargerStatus.AVAILABLE

    notification = Notification(
        user_id=current_user.id,
        title="Reservation Cancelled",
        message=f"Your reservation #{res.id} for {res.charger.identifier} has been cancelled.",
        type="INFO"
    )
    db.add(notification)

    db.commit()
    db.refresh(res)
    return res
