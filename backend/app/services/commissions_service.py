from decimal import Decimal
from sqlalchemy.orm import Session

from ..models import User, UserRole, Order, CommissionRecord, CommissionType

CONSULTOR_PERCENT = Decimal("0.05")
UPLINE1_PERCENT = Decimal("0.03")
UPLINE2_PERCENT = Decimal("0.02")
STAFF_POOL_PERCENT = Decimal("0.02")

def criar_comissoes_para_order(db: Session, order: Order):
    user = order.user
    total = Decimal(order.total_amount)

    if user.role == UserRole.consultant:
        valor = (CONSULTOR_PERCENT * total).quantize(Decimal("0.01"))
        _registrar_comissao(db, user, order, valor, CommissionType.consultant)

    upline1 = getattr(user, "referrer", None)
    if upline1:
        valor = (UPLINE1_PERCENT * total).quantize(Decimal("0.01"))
        _registrar_comissao(db, upline1, order, valor, CommissionType.upline_level1)

        upline2 = getattr(upline1, "referrer", None)
        if upline2:
            valor = (UPLINE2_PERCENT * total).quantize(Decimal("0.01"))
            _registrar_comissao(db, upline2, order, valor, CommissionType.upline_level2)

def _registrar_comissao(db: Session, beneficiary: User, order: Order, amount: Decimal, ctype: CommissionType):
    if amount <= 0:
        return
    rec = CommissionRecord(
        beneficiary_id=beneficiary.id,
        order_id=order.id,
        amount=amount,
        type=ctype,
    )
    db.add(rec)
