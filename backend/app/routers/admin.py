from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_admin
from ..models import User, UserRole

# ⚠️ Ajusta este import se o teu model tiver outro nome:
from ..models import Product

# ✅ Imports "safe" para não quebrar caso ainda não existam
try:
    from ..models import Order  # se existir no teu models.py
except Exception:
    Order = None  # type: ignore

try:
    from ..models import Payout  # se existir no teu models.py
except Exception:
    Payout = None  # type: ignore


router = APIRouter(prefix="/admin", tags=["admin"])


# -------------------------
# USERS
# -------------------------
@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = db.query(User)
    if hasattr(User, "created_at"):
        q = q.order_by(User.created_at.desc())

    users = q.all()
    return [
        {
            "id": str(u.id),
            "name": getattr(u, "name", None),
            "email": getattr(u, "email", None),
            "phone": getattr(u, "phone", None),
            "role": getattr(u.role, "value", u.role),
            "created_at": getattr(u, "created_at", None),
            "active": getattr(u, "active", None),
        }
        for u in users
    ]


@router.patch("/users/{user_id}/role")
def set_user_role(
    user_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    role_in = (payload.get("role") or "").strip().lower()
    if not role_in:
        raise HTTPException(status_code=400, detail="role is required")

    role_map = {
        "admin": UserRole.admin,
        "supplier": UserRole.supplier,
        "customer": UserRole.customer,
    }
    if role_in not in role_map:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role_map[role_in]
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "role": getattr(user.role, "value", user.role)}


# -------------------------
# PRODUCTS
# -------------------------

# ✅ A) LISTAR PRODUTOS (Admin vê todos, ativos e inativos)
@router.get("/products")
def admin_list_products(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = db.query(Product)
    if hasattr(Product, "created_at"):
        q = q.order_by(Product.created_at.desc())
    return q.all()


@router.post("/products", status_code=status.HTTP_201_CREATED)
def admin_create_product(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")

    try:
        stock = int(payload.get("stock") or 0)
    except Exception:
        raise HTTPException(status_code=400, detail="stock must be integer")

    product = Product(
        name=name,
        description=payload.get("description") or "",
        category=payload.get("category") or "Outros",
        image_url=payload.get("image_url") or "",
        video_url=payload.get("video_url") or "",
        active=bool(payload.get("active", True)),
        stock=stock,
        price=payload.get("price") if payload.get("price") is not None else "0.00",
        cost=payload.get("cost") if payload.get("cost") is not None else "0.00",
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}")
def admin_update_product(
    product_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field in ["name", "description", "category", "image_url", "video_url", "price", "cost", "active"]:
        if field in payload and payload[field] is not None and hasattr(product, field):
            setattr(product, field, payload[field])

    if "stock" in payload and payload["stock"] is not None and hasattr(product, "stock"):
        try:
            product.stock = int(payload["stock"])
        except Exception:
            raise HTTPException(status_code=400, detail="stock must be integer")

    db.commit()
    db.refresh(product)
    return product


@router.post("/products/{product_id}/deactivate")
def admin_deactivate_product(
    product_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not hasattr(product, "active"):
        raise HTTPException(status_code=400, detail="Product has no active field")

    product.active = False
    db.commit()
    db.refresh(product)
    return {"id": str(product.id), "active": product.active}


# -------------------------
# B) PAYOUTS (Admin histórico)
# -------------------------
@router.get("/payouts")
def admin_list_payouts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if Payout is None:
        raise HTTPException(
            status_code=501,
            detail="Model Payout não existe/import falhou. Diz-me o nome correto do model (ex: Withdrawal, Cashout, PayoutRequest)."
        )

    q = db.query(Payout)
    if hasattr(Payout, "created_at"):
        q = q.order_by(Payout.created_at.desc())
    return q.all()


# -------------------------
# C) ORDERS (Admin pedidos)
# -------------------------
@router.get("/orders")
def admin_list_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if Order is None:
        raise HTTPException(
            status_code=501,
            detail="Model Order não existe/import falhou. Diz-me o nome correto do model (ex: Purchase, Pedido, OrderModel)."
        )

    q = db.query(Order)
    if hasattr(Order, "created_at"):
        q = q.order_by(Order.created_at.desc())
    return q.all()