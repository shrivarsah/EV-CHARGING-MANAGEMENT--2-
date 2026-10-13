import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    ChargingSession, Charger, ChargerStatus, SessionStatus,
    Reservation, ReservationStatus, Payment, Notification, User, UserRole
)
from app.schemas import SessionOut, SessionCreate, SessionUpdateProgress, SessionComplete
from app.auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["Charging Sessions"])


@router.post("/start", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def start_session(
    sess_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    charger = db.query(Charger).filter(Charger.id == sess_in.charger_id).first()
    if not charger:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charger not found")

    # If linked to a reservation, verify user owns it
    if sess_in.reservation_id:
        reservation = db.query(Reservation).filter(Reservation.id == sess_in.reservation_id).first()
        if not reservation or reservation.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reservation ID.")
        reservation.status = ReservationStatus.COMPLETED
    else:
        if charger.status not in [ChargerStatus.AVAILABLE, ChargerStatus.RESERVED]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Charger is currently '{charger.status}' and cannot begin charging."
            )

    # Check if user already has an active session
    active = db.query(ChargingSession).filter(
        ChargingSession.user_id == current_user.id,
        ChargingSession.status == SessionStatus.ACTIVE
    ).first()
    if active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You already have an active charging session (#{active.id}). Complete it before starting a new one."
        )

    # Transition charger to CHARGING
    charger.status = ChargerStatus.CHARGING

    new_session = ChargingSession(
        user_id=current_user.id,
        charger_id=charger.id,
        reservation_id=sess_in.reservation_id,
        start_time=datetime.datetime.utcnow(),
        status=SessionStatus.ACTIVE,
        initial_soc=sess_in.initial_soc,
        current_soc=sess_in.initial_soc,
        target_soc=sess_in.target_soc,
        energy_consumed_kwh=0.0,
        duration_seconds=0,
        total_amount=0.0
    )
    db.add(new_session)

    notification = Notification(
        user_id=current_user.id,
        title="Charging Session Started",
        message=f"Charging commenced at {charger.station.name} ({charger.identifier}) at {charger.power_kw} kW.",
        type="INFO"
    )
    db.add(notification)

    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("", response_model=List[SessionOut])
def list_sessions(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ChargingSession).order_by(ChargingSession.created_at.desc())
    if current_user.role != UserRole.ADMIN:
        query = query.filter(ChargingSession.user_id == current_user.id)
    if status_filter:
        query = query.filter(ChargingSession.status == status_filter)
    return query.all()


@router.get("/active", response_model=Optional[SessionOut])
def get_user_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    active = db.query(ChargingSession).filter(
        ChargingSession.user_id == current_user.id,
        ChargingSession.status == SessionStatus.ACTIVE
    ).first()
    return active


@router.get("/{session_id}", response_model=SessionOut)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if current_user.role != UserRole.ADMIN and sess.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return sess


@router.patch("/{session_id}/progress", response_model=SessionOut)
def update_session_progress(
    session_id: int,
    prog: SessionUpdateProgress,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if current_user.role != UserRole.ADMIN and sess.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if sess.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not currently active")

    sess.current_soc = prog.current_soc
    sess.energy_consumed_kwh = prog.energy_consumed_kwh
    sess.duration_seconds = prog.duration_seconds
    rate = sess.charger.price_per_kwh if sess.charger else 18.50
    sess.total_amount = round(sess.energy_consumed_kwh * rate, 2)

    db.commit()
    db.refresh(sess)
    return sess


@router.post("/{session_id}/complete", response_model=SessionOut)
def complete_session(
    session_id: int,
    comp_in: SessionComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if current_user.role != UserRole.ADMIN and sess.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if sess.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session has already been completed")

    rate = sess.charger.price_per_kwh if sess.charger else 18.50
    final_amount = round(comp_in.energy_consumed_kwh * rate, 2)
    now = datetime.datetime.utcnow()

    sess.end_time = now
    sess.status = SessionStatus.COMPLETED
    sess.current_soc = comp_in.current_soc
    sess.energy_consumed_kwh = comp_in.energy_consumed_kwh
    sess.duration_seconds = comp_in.duration_seconds
    sess.total_amount = final_amount

    # Free the charger
    if sess.charger:
        sess.charger.status = ChargerStatus.AVAILABLE

    # Generate payment record
    tx_ref = f"TXN-{uuid.uuid4().hex[:10].upper()}"
    payment = Payment(
        session_id=sess.id,
        user_id=sess.user_id,
        transaction_ref=tx_ref,
        amount=final_amount,
        payment_method=comp_in.payment_method,
        status="SUCCESS",
        created_at=now
    )
    db.add(payment)

    # Notification
    minutes = round(comp_in.duration_seconds / 60)
    notif = Notification(
        user_id=sess.user_id,
        title="Charging Complete & Invoice Generated",
        message=f"Session completed ({comp_in.energy_consumed_kwh} kWh in {minutes} mins). Total amount: ₹{final_amount:.2f} ({tx_ref}).",
        type="SUCCESS"
    )
    db.add(notif)

    db.commit()
    db.refresh(sess)
    return sess
