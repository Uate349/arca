from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user, get_current_admin


# -----------------------------
# USER / CONSULTOR
# -----------------------------
router = APIRouter(prefix="/payouts", tags=["payouts"])


@router.get("/me", response_model=List[schemas.PayoutOut])
def my_payouts(
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    return (
        db.query(models.Payout)
        .filter(models.Payout.user_id == current.id)
        .order_by(models.Payout.created_at.desc())
        .all()
    )


# -----------------------------
# ADMIN
# -----------------------------
admin_router = APIRouter(prefix="/admin/payouts", tags=["admin-payouts"])


@admin_router.get("", response_model=List[schemas.PayoutOut])
def admin_list_payouts(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return db.query(models.Payout).order_by(models.Payout.created_at.desc()).all()


class GeneratePayload(schemas.BaseModel):  # se tu NÃO tiver BaseModel exportado, troca por: from pydantic import BaseModel
    days: int = 30


@admin_router.post("/generate")
def admin_generate_payouts(
    payload: GeneratePayload,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Gera payouts dos últimos X dias com base em comissões elegíveis (eligible) sem payout_id.
    """
    days = int(payload.days or 30)
    if days <= 0 or days > 365:
        raise HTTPException(status_code=422, detail="days inválido (1..365)")

    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)

    # pega comissões eligible ainda não associadas a payout
    commissions = (
        db.query(models.CommissionRecord)
        .filter(models.CommissionRecord.status == "eligible")
        .filter(models.CommissionRecord.payout_id.is_(None))
        .filter(models.CommissionRecord.created_at >= period_start)
        .filter(models.CommissionRecord.created_at <= period_end)
        .all()
    )

    if not commissions:
        return {"created": 0, "period_start": period_start.isoformat(), "period_end": period_end.isoformat()}

    # soma por beneficiário
    totals = {}
    for c in commissions:
        totals.setdefault(c.beneficiary_id, 0.0)
        totals[c.beneficiary_id] += float(c.amount or 0)

    created = 0

    # cria payout por beneficiário e "locka" comissões
    for beneficiary_id, total in totals.items():
        if total <= 0:
            continue

        payout = models.Payout(
            user_id=beneficiary_id,
            amount=total,
            status="pending",
            period_start=period_start,
            period_end=period_end,
        )
        db.add(payout)
        db.flush()  # para obter payout.id

        # associa commissions ao payout
        for c in commissions:
            if c.beneficiary_id == beneficiary_id:
                c.payout_id = payout.id
                c.status = "locked"  # ou mantém eligible se preferires

        created += 1

    db.commit()

    return {"created": created, "period_start": period_start.isoformat(), "period_end": period_end.isoformat()}


class MarkPaidPayload(schemas.BaseModel):  # se não tiver, usa Pydantic BaseModel
    method: str = "mpesa"
    reference: Optional[str] = None


@admin_router.post("/{payout_id}/mark-paid")
def admin_mark_payout_paid(
    payout_id: str,
    payload: MarkPaidPayload,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout não encontrado")

    payout.status = "processed"
    payout.paid_method = payload.method
    payout.paid_reference = payload.reference
    payout.paid_at = datetime.utcnow()

    # marca comissões associadas como paid (se existir esse campo/estado)
    qs = db.query(models.CommissionRecord).filter(models.CommissionRecord.payout_id == payout_id)
    for c in qs.all():
        c.status = "paid"

    db.commit()
    db.refresh(payout)

    return {"ok": True, "payout_id": payout_id, "status": payout.status}