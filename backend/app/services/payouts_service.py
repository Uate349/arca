from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..models import CommissionRecord, Payout, PayoutStatus, Order


def gerar_payouts_periodo(db: Session, period_start: datetime, period_end: datetime):
    """
    Gera payouts por período (ex: semanal, mensal) para todos os beneficiários
    com comissões pendentes. Marca as comissões como paid.
    """
    rows = (
        db.query(
            CommissionRecord.beneficiary_id,
            func.sum(CommissionRecord.amount).label("total")
        )
        .filter(
            CommissionRecord.created_at >= period_start,
            CommissionRecord.created_at < period_end,
            CommissionRecord.paid == False,
        )
        .group_by(CommissionRecord.beneficiary_id)
        .all()
    )

    for row in rows:
        beneficiary_id = row.beneficiary_id
        total = row.total or Decimal("0.00")
        if total <= 0:
            continue

        payout = Payout(
            user_id=beneficiary_id,
            period_start=period_start,
            period_end=period_end,
            amount=total,
            status=PayoutStatus.pending,
            state="generated",
        )
        db.add(payout)
        db.flush()  # gera ID do payout

        (
            db.query(CommissionRecord)
            .filter(
                CommissionRecord.beneficiary_id == beneficiary_id,
                CommissionRecord.created_at >= period_start,
                CommissionRecord.created_at < period_end,
                CommissionRecord.paid == False,
            )
            .update(
                {
                    "paid": True,
                    "payout_id": payout.id,
                    "status": "paid"
                },
                synchronize_session=False
            )
        )
    db.commit()


def gerar_payout_para_order(db: Session, order: Order) -> Optional[Payout]:
    """
    Gera payout automático para comissões de um pedido específico.
    Retorna o payout criado (ou None se não houver comissões).
    """
    # Busca comissões elegíveis (pending ou locked) para o pedido
    commissions = (
        db.query(CommissionRecord)
        .filter(
            CommissionRecord.order_id == order.id,
            CommissionRecord.paid == False,
            CommissionRecord.status.in_(["pending", "eligible", "locked"])
        )
        .all()
    )

    if not commissions:
        return None

    # Agrupa por beneficiário
    payouts_dict = {}
    for c in commissions:
        if c.beneficiary_id not in payouts_dict:
            payouts_dict[c.beneficiary_id] = Decimal("0.00")
        payouts_dict[c.beneficiary_id] += c.amount

    created_payouts = []

    for beneficiary_id, total_amount in payouts_dict.items():
        payout = Payout(
            user_id=beneficiary_id,
            period_start=datetime.utcnow(),
            period_end=datetime.utcnow(),
            amount=total_amount,
            status=PayoutStatus.pending,
            state="generated",
        )
        db.add(payout)
        db.flush()

        # Atualiza comissões vinculando payout e marcando como paid
        for c in commissions:
            if c.beneficiary_id == beneficiary_id:
                c.payout_id = payout.id
                c.paid = True
                c.status = "paid"

        created_payouts.append(payout)

    db.commit()

    # Retorna o primeiro payout (ou você pode retornar todos se precisar)
    return created_payouts[0] if created_payouts else None