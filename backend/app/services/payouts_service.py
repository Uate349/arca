from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import CommissionRecord, Payout, PayoutStatus

def gerar_payouts_periodo(db: Session, period_start: datetime, period_end: datetime):
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
        )
        db.add(payout)

        (
            db.query(CommissionRecord)
            .filter(
                CommissionRecord.beneficiary_id == beneficiary_id,
                CommissionRecord.created_at >= period_start,
                CommissionRecord.created_at < period_end,
                CommissionRecord.paid == False,
            )
            .update({"paid": True}, synchronize_session=False)
        )
