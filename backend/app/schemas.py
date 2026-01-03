from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from .models import UserRole, UserLevel, OrderStatus, CommissionType, PayoutStatus

# ---------------- Users ----------------
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.customer
    referred_by_id: Optional[str] = None

class UserOut(UserBase):
    id: str
    role: UserRole
    level: UserLevel
    points_balance: int
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------- Auth ----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginData(BaseModel):
    email: EmailStr
    password: str

# ---------------- Products ----------------
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    cost: Decimal
    stock: int
    category: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    active: Optional[bool] = None

class ProductOut(ProductBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------- Orders ----------------
class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    points_to_use: int = 0

class OrderItemOut(BaseModel):
    id: str
    product_id: str
    quantity: int
    unit_price: Decimal

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: str
    status: OrderStatus
    total_amount: Decimal
    discount_amount: Decimal
    points_used: int
    points_earned: int
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True

# ---------------- Commissions & Payouts ----------------
class CommissionRecordOut(BaseModel):
    id: str
    order_id: str
    amount: Decimal
    type: CommissionType
    paid: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PayoutOut(BaseModel):
    id: str
    period_start: datetime
    period_end: datetime
    amount: Decimal
    status: PayoutStatus
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------- NOVOS SCHEMAS - Webhook Pagamento Real ----------------
class PaymentWebhookIn(BaseModel):
    order_id: str               # Código do pedido enviado pelo operador
    amount_paid: Decimal        # Valor pago pelo cliente
    account_number: str         # Conta empresarial que recebeu o pagamento
    method: str                 # "mpesa" ou "emola"
    reference: Optional[str] = None  # Código de referência do pagamento

class PaymentWebhookOut(BaseModel):
    message: str
    order_id: str
    amount_to_admin: Decimal
    amount_to_system: Decimal
