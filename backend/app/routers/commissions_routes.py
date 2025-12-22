from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user, get_current_admin

router = APIRouter()

@router.get("/me", response_model=List[schemas.CommissionRecordOut])
def my_commissions(db: Session = Depends(get_db), current = Depends(get_current_user)):
    recs = (
        db.query(models.CommissionRecord)
        .filter(models.CommissionRecord.beneficiary_id == current.id)
        .order_by(models.CommissionRecord.created_at.desc())
        .all()
    )
    return recs

@router.get("/", response_model=List[schemas.CommissionRecordOut])
def all_commissions(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    recs = db.query(models.CommissionRecord).all()
    return recs
