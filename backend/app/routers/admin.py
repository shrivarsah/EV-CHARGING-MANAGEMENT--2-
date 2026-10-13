import datetime
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Station, Charger, ChargerStatus, ChargingSession,
    SessionStatus, Payment, Notification, User
)
from app.schemas import AdminStatsOut, SessionOut
from app.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/stats", response_model=AdminStatsOut)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_stations = db.query(Station).count()
    total_chargers = db.query(Charger).count()
    available_chargers = db.query(Charger).filter(Charger.status == ChargerStatus.AVAILABLE).count()
    active_sessions = db.query(ChargingSession).filter(ChargingSession.status == SessionStatus.ACTIVE).count()

    total_energy = db.query(func.sum(ChargingSession.energy_consumed_kwh)).scalar() or 0.0
    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "SUCCESS").scalar() or 0.0

    utilization_rate = 0.0
    if total_chargers > 0:
        busy = total_chargers - available_chargers
        utilization_rate = round((busy / total_chargers) * 100, 1)

    return AdminStatsOut(
        total_stations=total_stations,
        total_chargers=total_chargers,
        available_chargers=available_chargers,
        active_sessions=active_sessions,
        total_energy_kwh=round(total_energy, 2),
        total_revenue=round(total_revenue, 2),
        utilization_rate=utilization_rate
    )


@router.get("/active-sessions", response_model=List[SessionOut])
def get_all_active_sessions(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return db.query(ChargingSession).filter(
        ChargingSession.status == SessionStatus.ACTIVE
    ).order_by(ChargingSession.start_time.desc()).all()


@router.post("/sessions/{session_id}/stop", response_model=SessionOut)
def admin_emergency_stop_session(
    session_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    sess = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if sess.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not currently active")

    now = datetime.datetime.now(datetime.timezone.utc)
    sess.end_time = now
    sess.status = SessionStatus.COMPLETED
    rate = sess.charger.price_per_kwh if sess.charger else 18.50
    final_amount = round(sess.energy_consumed_kwh * rate, 2)
    sess.total_amount = final_amount

    if sess.charger:
        sess.charger.status = ChargerStatus.AVAILABLE

    # Record payment
    payment = Payment(
        session_id=sess.id,
        user_id=sess.user_id,
        transaction_ref=f"TXN-ADMIN-{uuid.uuid4().hex[:8].upper()}",
        amount=final_amount,
        payment_method="Admin Settled",
        status="SUCCESS",
        created_at=now
    )
    db.add(payment)

    # User notification
    notif = Notification(
        user_id=sess.user_id,
        title="Session Stopped by Station Administrator",
        message=f"Charging session #{sess.id} was stopped by station management. Invoiced: ₹{final_amount:.2f}.",
        type="WARNING"
    )
    db.add(notif)

    db.commit()
    db.refresh(sess)
    return sess
