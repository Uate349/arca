from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models import User, UserRole, Order, CommissionRecord, CommissionType

CONSULTOR_PERCENT = Decimal("0.05")
UPLINE1_PERCENT = Decimal("0.03")
UPLINE2_PERCENT = Decimal("0.02")
STAFF_POOL_PERCENT = Decimal("0.02")  # reservado (não usado agora)

ELIGIBILITY_DAYS = 0  # 0 = eligible já; 7 = pending por 7 dias (exemplo)


def criar_comissoes_para_order(db: Session, order: Order):
    # garante relacionamentos carregados (sem rebentar se falhar)
    try:
        db.refresh(order)
    except Exception:
        pass

    total = Decimal(order.total_amount or 0)
    discount = Decimal(getattr(order, "discount_amount", 0) or 0)

    # ✅ base perfeita: não pagar comissão sobre desconto/pontos
    base = total - discount
    if base < 0:
        base = Decimal("0.00")

    if base <= 0:
        return

    # ✅ consultor que gerou a venda (preferência)
    consultant = None
    if getattr(order, "consultant_id", None):
        consultant = db.query(User).filter(User.id == order.consultant_id).first()

    # ✅ fallback compat: se não tem consultant_id e comprador é consultor
    if consultant is None:
        user = getattr(order, "user", None)
        if not user and getattr(order, "user_id", None):
            user = db.query(User).filter(User.id == order.user_id).first()
        if user and user.role == UserRole.consultant:
            consultant = user

    if not consultant:
        return

    now = datetime.utcnow()

    # ✅ elegibilidade (perfeito)
    if ELIGIBILITY_DAYS and ELIGIBILITY_DAYS > 0:
        status = "pending"
        eligible_at = now + timedelta(days=ELIGIBILITY_DAYS)
    else:
        status = "eligible"
        eligible_at = now

    # 1) comissão consultor
    valor = (CONSULTOR_PERCENT * base).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    _registrar_comissao_idempotente(
        db=db,
        beneficiary=consultant,
        order=order,
        amount=valor,
        ctype=CommissionType.consultant,
        rate=CONSULTOR_PERCENT,
        status=status,
        eligible_at=eligible_at,
    )

    # 2) upline 1 e 2 (se existir referrer)
    upline1 = getattr(consultant, "referrer", None)
    if upline1:
        valor = (UPLINE1_PERCENT * base).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        _registrar_comissao_idempotente(
            db=db,
            beneficiary=upline1,
            order=order,
            amount=valor,
            ctype=CommissionType.upline_level1,
            rate=UPLINE1_PERCENT,
            status=status,
            eligible_at=eligible_at,
        )

        upline2 = getattr(upline1, "referrer", None)
        if upline2:
            valor = (UPLINE2_PERCENT * base).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            _registrar_comissao_idempotente(
                db=db,
                beneficiary=upline2,
                order=order,
                amount=valor,
                ctype=CommissionType.upline_level2,
                rate=UPLINE2_PERCENT,
                status=status,
                eligible_at=eligible_at,
            )


def _registrar_comissao_idempotente(
    db: Session,
    beneficiary: User,
    order: Order,
    amount: Decimal,
    ctype: CommissionType,
    rate: Decimal | None,
    status: str,
    eligible_at: datetime,
):
    if amount <= 0:
        return

    # ✅ evita duplicar (rápido)
    exists = (
        db.query(CommissionRecord)
        .filter(
            CommissionRecord.beneficiary_id == beneficiary.id,
            CommissionRecord.order_id == order.id,
            CommissionRecord.type == ctype,
        )
        .first()
    )
    if exists:
        return

    rec = CommissionRecord(
        beneficiary_id=beneficiary.id,
        order_id=order.id,
        amount=amount,
        type=ctype,

        # ✅ compat / campos do teu DB
        paid=False,
        payout_id=None,

        status=status,
        rate=rate,
        eligible_at=eligible_at,
    )

    db.add(rec)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return