from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Payment, User, UserRole
from app.schemas import PaymentOut
from app.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=List[PaymentOut])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Payment).order_by(Payment.created_at.desc())
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Payment.user_id == current_user.id)
    return query.all()


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")
    if current_user.role != UserRole.ADMIN and payment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return payment
