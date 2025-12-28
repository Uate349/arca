import uuid
from datetime import datetime
import enum
from decimal import Decimal

from sqlalchemy import (
    Column, String, DateTime, Integer, ForeignKey, Numeric, Boolean, Enum, Text
)
from sqlalchemy.orm import relationship

from .database import Base


class SerializerMixin:
    def to_dict(self):
        out = {}
        for col in self.__table__.columns:
            v = getattr(self, col.name)
            if isinstance(v, Decimal):
                out[col.name] = float(v)
            elif isinstance(v, datetime):
                out[col.name] = v.isoformat()
            else:
                out[col.name] = v
        return out


class UserRole(str, enum.Enum):
    customer = "customer"
    consultant = "consultant"
    staff = "staff"
    admin = "admin"


class UserLevel(str, enum.Enum):
    bronze = "bronze"
    prata = "prata"
    ouro = "ouro"


class User(Base, SerializerMixin):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    level = Column(Enum(UserLevel), default=UserLevel.bronze, nullable=False)
    points_balance = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    referred_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    referred_users = relationship("User", backref="referrer", remote_side=[id])

    # ✅ NOVO (não quebra): consultor padrão do cliente
    default_consultant_id = Column(String, ForeignKey("users.id"), nullable=True)

    orders = relationship("Order", back_populates="user")
    commissions = relationship("CommissionRecord", back_populates="beneficiary")
    payouts = relationship("Payout", back_populates="user")


class Product(Base, SerializerMixin):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    category = Column(String)
    image_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    shipped = "shipped"
    completed = "completed"
    canceled = "canceled"


class Order(Base, SerializerMixin):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0)
    points_used = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ NOVOS (não quebra)
    paid_at = Column(DateTime, nullable=True)
    consultant_id = Column(String, ForeignKey("users.id"), nullable=True)
    ref_source = Column(String, nullable=True)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    commissions = relationship("CommissionRecord", back_populates="order")


class OrderItem(Base, SerializerMixin):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class PointsType(str, enum.Enum):
    earn = "earn"
    redeem = "redeem"
    expire = "expire"
    adjust = "adjust"


class PointsTransaction(Base, SerializerMixin):
    __tablename__ = "points_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(PointsType), nullable=False)
    points = Column(Integer, nullable=False)
    description = Column(String)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommissionType(str, enum.Enum):
    consultant = "consultant"
    upline_level1 = "upline_level1"
    upline_level2 = "upline_level2"
    upline_level3 = "upline_level3"
    staff_pool = "staff_pool"


class CommissionRecord(Base, SerializerMixin):
    __tablename__ = "commission_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    beneficiary_id = Column(String, ForeignKey("users.id"), nullable=False)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(Enum(CommissionType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ antigo (mantém compat)
    paid = Column(Boolean, default=False)

    # ✅ NOVOS (não quebra)
    status = Column(String, nullable=False, default="pending")   # pending | eligible | locked | paid | void
    rate = Column(Numeric(6, 4), nullable=True)
    eligible_at = Column(DateTime, nullable=True)
    payout_id = Column(String, ForeignKey("payouts.id"), nullable=True)

    beneficiary = relationship("User", back_populates="commissions")
    order = relationship("Order", back_populates="commissions")


class PayoutStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"


class Payout(Base, SerializerMixin):
    __tablename__ = "payouts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    # antigo
    status = Column(Enum(PayoutStatus), default=PayoutStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ NOVOS (não quebra)
    paid_at = Column(DateTime, nullable=True)
    method = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    state = Column(String, nullable=False, default="generated")  # generated | paid

    user = relationship("User", back_populates="payouts")