from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_admin
from ..models import User, UserRole, Product

# ✅ Imports "safe" para não quebrar caso ainda não existam
try:
    from ..models import Order
except Exception:
    Order = None  # type: ignore

try:
    from ..models import Payout
except Exception:
    Payout = None  # type: ignore

# ✅ Service "safe"
try:
    from ..services.payouts_service import gerar_payouts_periodo
except Exception:
    gerar_payouts_periodo = None  # type: ignore

router = APIRouter(prefix="/admin", tags=["admin"])


# -------------------------
# HELPERS (JSON safe)
# -------------------------
def _enum_to_value(v: Any) -> Any:
    try:
        return v.value  # type: ignore[attr-defined]
    except Exception:
        return v


def _model_to_dict(obj: Any) -> Dict[str, Any]:
    if hasattr(obj, "to_dict") and callable(getattr(obj, "to_dict")):
        d = obj.to_dict()
        for k, v in list(d.items()):
            d[k] = _enum_to_value(v)
        return d

    out: Dict[str, Any] = {}
    if hasattr(obj, "__table__") and hasattr(obj.__table__, "columns"):
        for col in obj.__table__.columns:
            v = getattr(obj, col.name)
            out[col.name] = _enum_to_value(v)
    return out


# -------------------------
# USERS (ADMIN)
# -------------------------
@router.get("/users")
def admin_list_users(
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
            "role": _enum_to_value(getattr(u, "role", None)),
            "created_at": getattr(u, "created_at", None),
            "active": getattr(u, "active", None),
        }
        for u in users
    ]


@router.patch("/users/{user_id}/role")
def admin_set_user_role(
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
        "staff": UserRole.staff,
        "consultant": UserRole.consultant,
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
    return {"id": str(user.id), "role": _enum_to_value(user.role)}


# -------------------------
# PRODUCTS (ADMIN)
# -------------------------
@router.get("/products")
def admin_list_products(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = db.query(Product)
    if hasattr(Product, "created_at"):
        q = q.order_by(Product.created_at.desc())
    products = q.all()
    return [_model_to_dict(p) for p in products]


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
        image_url=payload.get("image_url") or None,
        video_url=payload.get("video_url") or None,
        active=bool(payload.get("active", True)),
        stock=stock,
        price=payload.get("price") if payload.get("price") is not None else "0.00",
        cost=payload.get("cost") if payload.get("cost") is not None else "0.00",
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return _model_to_dict(product)


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
    return _model_to_dict(product)


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
    return {"id": str(product.id), "active": bool(product.active)}


# -------------------------
# PAYOUTS (ADMIN)
# -------------------------
@router.get("/payouts")
def admin_list_payouts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if Payout is None:
        raise HTTPException(status_code=501, detail="Model Payout não existe/import falhou.")

    q = db.query(Payout)
    if hasattr(Payout, "created_at"):
        q = q.order_by(Payout.created_at.desc())
    payouts = q.all()
    return [_model_to_dict(p) for p in payouts]


@router.post("/payouts/generate")
def admin_generate_payouts(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if Payout is None:
        raise HTTPException(status_code=501, detail="Model Payout não existe/import falhou.")
    if gerar_payouts_periodo is None:
        raise HTTPException(status_code=501, detail="Serviço gerar_payouts_periodo não disponível.")

    days = payload.get("days", 30)
    try:
        days = int(days)
    except Exception:
        raise HTTPException(status_code=400, detail="days must be integer")

    if days < 1 or days > 365:
        raise HTTPException(status_code=422, detail="days inválido (1..365)")

    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)

    before = db.query(Payout).count()

    gerar_payouts_periodo(db, period_start, period_end)
    db.commit()

    after = db.query(Payout).count()

    return {
        "created": max(0, after - before),
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
    }


# -------------------------
# ORDERS (ADMIN)
# -------------------------
@router.get("/orders")
def admin_list_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if Order is None:
        raise HTTPException(status_code=501, detail="Model Order não existe/import falhou.")

    q = db.query(Order)
    if hasattr(Order, "created_at"):
        q = q.order_by(Order.created_at.desc())
    orders = q.all()
    return [_model_to_dict(o) for o in orders]