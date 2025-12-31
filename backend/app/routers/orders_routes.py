from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any, Dict
from decimal import Decimal

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user
from ..services.points_service import (
    calcular_max_desconto_pontos,
    calcular_pontos_ganhos,
    adicionar_pontos,
    usar_pontos,
)

from ..utils.pdf_generator import generate_order_pdf
from ..utils.printer import print_pdf

router = APIRouter()


def _stock_conflict(items: List[Dict[str, Any]]):
    """
    Resposta consistente e amigável para frontend.
    """
    raise HTTPException(
        status_code=409,
        detail={"detail": "Sem stock", "items": items},
    )


@router.post("/", response_model=schemas.OrderOut)
def create_order(
    data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    consultant_id = getattr(data, "consultant_id", None)
    ref_source = getattr(data, "ref_source", None)

    if not consultant_id and getattr(current, "role", None) == models.UserRole.consultant:
        consultant_id = current.id

    total = Decimal("0.00")
    stock_issues: List[Dict[str, Any]] = []

    products_by_id: Dict[str, models.Product] = {}

    for item in data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id,
            models.Product.active == True
        ).first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Produto {item.product_id} não encontrado")

        products_by_id[item.product_id] = product

        requested = int(item.quantity or 0)
        available = int(product.stock or 0)

        if requested <= 0:
            raise HTTPException(status_code=400, detail="Quantidade inválida")

        if available < requested:
            stock_issues.append({
                "product_id": product.id,
                "name": product.name,
                "available": available,
                "requested": requested,
            })
            continue

        line_total = Decimal(product.price) * requested
        total += line_total

    if stock_issues:
        _stock_conflict(stock_issues)

    # Cria pedido como PENDING
    order = models.Order(
        user_id=current.id,
        status=models.OrderStatus.pending,
        total_amount=total,
        discount_amount=Decimal("0.00"),
        points_used=0,
        points_earned=0,
        consultant_id=consultant_id,
        ref_source=ref_source,
    )
    db.add(order)
    db.flush()  # gera ID

    for item in data.items:
        product = products_by_id[item.product_id]
        requested = int(item.quantity)

        oi = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=requested,
            unit_price=product.price,
        )
        db.add(oi)

        # baixa stock agora
        product.stock = int(product.stock or 0) - requested

    max_points = calcular_max_desconto_pontos(current, total)
    points_to_use = min(int(max_points), int(data.points_to_use or 0))
    discount_amount = Decimal(points_to_use)

    if points_to_use > 0:
        usar_pontos(db, current, points_to_use, "Uso de pontos na compra", order.id)

    order.discount_amount = discount_amount
    order.points_used = points_to_use

    payable = total - discount_amount
    points_earned = calcular_pontos_ganhos(current, payable)

    if points_earned and int(points_earned) > 0:
        adicionar_pontos(db, current, int(points_earned), "Pontos por compra", order.id)
        order.points_earned = int(points_earned)

    db.commit()
    db.refresh(order)

    # ✅ Geração do PDF do endereço e impressão
    try:
        order_dict = {
            "id": order.id,
            "delivery_address": data.delivery_address,  # assume que vem no schema OrderCreate
            "items": [{"name": i.name, "quantity": i.quantity, "price": str(i.unit_price)} for i in order.order_items],
            "total_amount": str(order.total_amount),
        }
        pdf_file = generate_order_pdf(order_dict)
        print_pdf(pdf_file)
    except Exception as e:
        print(f"Erro ao gerar/imprimir PDF: {e}")

    return order


@router.get("/me", response_model=List[schemas.OrderOut])
def my_orders(
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return orders
