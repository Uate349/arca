from decimal import Decimal
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..models import User, UserLevel, PointsTransaction, PointsType

LEVEL_PERCENT = {
    UserLevel.bronze: Decimal("0.02"),
    UserLevel.prata: Decimal("0.05"),
    UserLevel.ouro: Decimal("0.10"),
}

LEVEL_MONTHLY_CAP = {
    UserLevel.bronze: 50,
    UserLevel.prata: 100,
    UserLevel.ouro: 150,
}

def calcular_max_desconto_pontos(user: User, total):
    max_percentual = Decimal("0.30") * Decimal(total)
    return min(user.points_balance, int(max_percentual))


def calcular_pontos_ganhos(user: User, valor_pago_em_dinheiro) -> int:
    percent = LEVEL_PERCENT[user.level]
    pontos = int(Decimal(valor_pago_em_dinheiro) * percent)
    return pontos


def adicionar_pontos(db: Session, user: User, points: int, description: str, order_id: str | None = None):
    if points <= 0:
        return
    user.points_balance += points
    tx = PointsTransaction(
        user_id=user.id,
        type=PointsType.earn,
        points=points,
        description=description,
        order_id=order_id,
    )
    db.add(tx)


def usar_pontos(db: Session, user: User, points: int, description: str, order_id: str):
    if points <= 0:
        return
    if user.points_balance < points:
        raise ValueError("Saldo de pontos insuficiente")
    user.points_balance -= points
    tx = PointsTransaction(
        user_id=user.id,
        type=PointsType.redeem,
        points=-points,
        description=description,
        order_id=order_id,
    )
    db.add(tx)
