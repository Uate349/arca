from decimal import Decimal
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..deps import get_current_user
from ..services.payments_service import criar_payment_intent, simular_confirmacao_pagamento

# comissão perfeita (idempotente)
from ..services.commissions_service import criar_comissoes_para_order

router = APIRouter()


class PaymentRequest(BaseModel):
    amount: Decimal
    method: str  # "mpesa" | "emola" | "bank"


# ✅ NOVO: confirmar pagamento de um pedido
class ConfirmOrderPaymentRequest(BaseModel):
    order_id: str
    method: str  # "mpesa" | "emola" | "bank"
    reference: str | None = None  # id transação externo (opcional)


@router.post("/intent")
def create_payment_intent(data: PaymentRequest):
    intent = criar_payment_intent(data.amount, data.method)  # type: ignore[arg-type]
    # Em ambiente real, retornaria URL de pagamento ou instruções USSD
    return {
        "reference": intent.reference,
        "status": intent.status,
        "method": intent.method,
        "amount": str(intent.amount),
    }


@router.post("/confirm")
def confirm_payment(data: PaymentRequest):
    intent = criar_payment_intent(data.amount, data.method)  # dummy
    intent = simular_confirmacao_pagamento(intent)
    return {
        "reference": intent.reference,
        "status": intent.status,
        "method": intent.method,
        "amount": str(intent.amount),
    }


# ------------------------------------------------------------
# ✅ NOVOS ENDPOINTS (não quebram os antigos)
# ------------------------------------------------------------

@router.post("/orders/{order_id}/confirm")
def confirm_payment_for_order(
    order_id: str,
    data: ConfirmOrderPaymentRequest,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    """
    Confirma pagamento de um pedido específico e:
    - marca Order como PAID com paid_at
    - cria comissões de forma idempotente
    (mantém o resto intacto)
    """
    if data.order_id != order_id:
        raise HTTPException(status_code=400, detail="order_id mismatch")

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    # ✅ segurança: só dono ou admin/staff pode pagar
    if order.user_id != current.id and current.role not in [models.UserRole.admin, models.UserRole.staff]:
        raise HTTPException(status_code=403, detail="Sem permissão para pagar este pedido")

    # ✅ se já está pago, não duplica (idempotência)
    if order.status == models.OrderStatus.paid:
        return {
            "ok": True,
            "status": order.status.value,
            "order_id": order.id,
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "message": "Pedido já estava pago",
        }

    # ✅ (opcional) valida total do pedido vs amount — aqui não temos amount no request
    # se quiseres, eu adiciono amount e valido certinho.

    # marca como pago
    order.status = models.OrderStatus.paid
    order.paid_at = datetime.utcnow()

    # ✅ cria comissões (ideal: nasce no paid)
    # IMPORTANTE: tua função criar_comissoes_para_order deve ser idempotente,
    # mas mesmo que não seja, vamos reforçar isso com UniqueConstraint no model (já fizemos).
    criar_comissoes_para_order(db, order)

    db.commit()
    db.refresh(order)

    return {
        "ok": True,
        "status": order.status.value,
        "order_id": order.id,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "method": data.method,
        "reference": data.reference,
    }


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
    - 'void' comissões (sem apagar histórico)
    """
    if current.role not in [models.UserRole.admin, models.UserRole.staff]:
        raise HTTPException(status_code=403, detail="Apenas admin/staff")

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if order.status == models.OrderStatus.canceled:
        return {"ok": True, "message": "Pedido já cancelado"}

    # repõe stock
    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
    for it in items:
        product = db.query(models.Product).filter(models.Product.id == it.product_id).first()
        if product:
            product.stock = int(product.stock or 0) + int(it.quantity or 0)

    # void comissões relacionadas
    comms = db.query(models.CommissionRecord).filter(models.CommissionRecord.order_id == order.id).all()
    for c in comms:
        c.status = "void"
        c.paid = False

    order.status = models.OrderStatus.canceled

    db.commit()
    return {"ok": True, "status": order.status.value, "order_id": order.id}