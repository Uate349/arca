from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user, get_current_admin

router = APIRouter()


# -----------------------------
# ✅ CONSULTOR / USER: Minhas comissões (mantido)
# -----------------------------
@router.get("/me", response_model=List[schemas.CommissionRecordOut])
def my_commissions(
    status: Optional[str] = Query(None, description="pending|eligible|locked|paid|void"),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    q = db.query(models.CommissionRecord).filter(models.CommissionRecord.beneficiary_id == current.id)

    if status:
        q = q.filter(models.CommissionRecord.status == status)

    # filtros de data (string -> datetime) sem quebrar
    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            q = q.filter(models.CommissionRecord.created_at >= dt_from)
        except Exception:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            q = q.filter(models.CommissionRecord.created_at <= dt_to)
        except Exception:
            pass

    recs = (
        q.order_by(models.CommissionRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return recs


# -----------------------------
# ✅ ADMIN: todas comissões (mantido + melhorado)
# -----------------------------
@router.get("/", response_model=List[schemas.CommissionRecordOut])
def all_commissions(
    beneficiary_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    q = db.query(models.CommissionRecord)

    if beneficiary_id:
        q = q.filter(models.CommissionRecord.beneficiary_id == beneficiary_id)

    if order_id:
        q = q.filter(models.CommissionRecord.order_id == order_id)

    if status:
        q = q.filter(models.CommissionRecord.status == status)

    if type:
        # aceita string igual ao Enum (ex.: "consultant")
        try:
            q = q.filter(models.CommissionRecord.type == models.CommissionType(type))
        except Exception:
            pass

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            q = q.filter(models.CommissionRecord.created_at >= dt_from)
        except Exception:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            q = q.filter(models.CommissionRecord.created_at <= dt_to)
        except Exception:
            pass

    recs = (
        q.order_by(models.CommissionRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return recs


# -----------------------------
# ✅ CONSULTOR: resumo profissional (novo)
# -----------------------------
@router.get("/summary")
def my_commissions_summary(
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    """
    Retorna totais por status e total geral para mostrar no painel do consultor.
    Não depende de schema novo (não quebra).
    """
    rows = (
        db.query(models.CommissionRecord.status, func.sum(models.CommissionRecord.amount))
        .filter(models.CommissionRecord.beneficiary_id == current.id)
        .group_by(models.CommissionRecord.status)
        .all()
    )

    by_status = {status: float(total or 0) for status, total in rows}

    total = float(sum(by_status.values())) if by_status else 0.0

    # compatibilidade com o bool antigo "paid"
    paid_total = (
        db.query(func.sum(models.CommissionRecord.amount))
        .filter(models.CommissionRecord.beneficiary_id == current.id)
        .filter(models.CommissionRecord.paid == True)
        .scalar()
    )

    return {
        "beneficiary_id": current.id,
        "total": total,
        "by_status": by_status,
        "paid_total": float(paid_total or 0),
    }