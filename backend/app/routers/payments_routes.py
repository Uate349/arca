from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..deps import get_current_user
from ..services.payments_service import (
    criar_payment_intent,
    simular_confirmacao_pagamento,
)

# ✅ comissão perfeita (idempotente)
from ..services.commissions_service import criar_comissoes_para_order

router = APIRouter(prefix="/payments", tags=["payments"])


# ------------------------------------------------------------
# Schemas
# ------------------------------------------------------------

class PaymentRequest(BaseModel):
    amount: Decimal
    method: str  # "mpesa" | "emola" | "bank"


class ConfirmOrderPaymentRequest(BaseModel):
    order_id: str
    amount: Decimal
    method: str  # "mpesa" | "emola" | "bank"
    reference: str | None = None


# ------------------------------------------------------------
# Payment intent (mantido)
# ------------------------------------------------------------

@router.post("/intent")
def create_payment_intent(data: PaymentRequest):
    intent = criar_payment_intent(data.amount, data.method)
    return {
        "reference": intent.reference,
        "status": intent.status,
        "method": intent.method,
        "amount": str(intent.amount),
    }


# ------------------------------------------------------------
# ✅ CONFIRMAR PAGAMENTO DE ORDER (OFICIAL)
# Frontend usa este endpoint
# ------------------------------------------------------------

@router.post("/confirm")
def confirm_payment(
    data: ConfirmOrderPaymentRequest,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    """
    Confirma pagamento de um pedido e:
    - valida amount
    - marca Order como PAID
    - cria comissões (idempotente)
    """

    order = db.query(models.Order).filter(models.Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    # 🔐 segurança: só dono ou admin/staff
    if order.user_id != current.id and current.role not in [
        models.UserRole.admin,
        models.UserRole.staff,
    ]:
        raise HTTPException(status_code=403, detail="Sem permissão para pagar este pedido")

    # ✅ idempotência: se já pago, retorna ok
    if order.status == models.OrderStatus.paid:
        return {
            "ok": True,
            "status": order.status.value,
            "order_id": order.id,
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "message": "Pedido já estava pago",
        }

    # ✅ valida amount
    expected = Decimal(order.total_amount or 0) - Decimal(order.discount_amount or 0)
    if Decimal(data.amount) != expected:
        raise HTTPException(
            status_code=400,
            detail=f"Amount inválido. Esperado {expected}, recebido {data.amount}",
        )

    # (simulação / gateway fake)
    intent = criar_payment_intent(data.amount, data.method)
    intent = simular_confirmacao_pagamento(intent)

    # ✅ marca order como pago
    order.status = models.OrderStatus.paid
    order.paid_at = datetime.utcnow()

    # ✅ cria comissões (nasce no PAID)
    criar_comissoes_para_order(db, order)

    db.commit()
    db.refresh(order)

    return {
        "ok": True,
        "status": order.status.value,
        "order_id": order.id,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "method": data.method,
        "reference": data.reference or intent.reference,
        "amount": str(data.amount),
    }


# ------------------------------------------------------------
# Refund / cancel (mantido)
# ------------------------------------------------------------

@router.post("/orders/{order_id}/refund")
def refund_order(
    order_id: str,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    """
    Refund/cancel perfeito (base):
    - marca order como canceled
    - repõe stock
    - void comissões (sem apagar histórico)
    """
    if current.role not in [models.UserRole.admin, models.UserRole.staff]:
        raise HTTPException(status_code=403, detail="Apenas admin/staff")

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if order.status == models.OrderStatus.canceled:
        return {"ok": True, "message": "Pedido já cancelado"}

    # repõe stock
    items = (
        db.query(models.OrderItem)
        .filter(models.OrderItem.order_id == order.id)
        .all()
    )
    for it in items:
        product = (
            db.query(models.Product)
            .filter(models.Product.id == it.product_id)
            .first()
        )
        if product:
            product.stock = int(product.stock or 0) + int(it.quantity or 0)

    # void comissões
    comms = (
        db.query(models.CommissionRecord)
        .filter(models.CommissionRecord.order_id == order.id)
        .all()
    )
    for c in comms:
        c.status = "void"
        c.paid = False

    order.status = models.OrderStatus.canceled

    db.commit()
    return {"ok": True, "status": order.status.value, "order_id": order.id}