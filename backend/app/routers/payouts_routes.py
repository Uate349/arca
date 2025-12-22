from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user, get_current_admin

router = APIRouter()

@router.get("/me", response_model=List[schemas.PayoutOut])
def my_payouts(db: Session = Depends(get_db), current = Depends(get_current_user)):
    payouts = db.query(models.Payout).filter(models.Payout.user_id == current.id).all()
    return payouts

@router.get("/", response_model=List[schemas.PayoutOut])
def all_payouts(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    payouts = db.query(models.Payout).all()
    return payouts
