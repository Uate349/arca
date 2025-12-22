from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user
from ..services.points_service import calcular_max_desconto_pontos, calcular_pontos_ganhos, adicionar_pontos, usar_pontos
from ..services.commissions_service import criar_comissoes_para_order

router = APIRouter()

@router.post("/", response_model=schemas.OrderOut)
def create_order(data: schemas.OrderCreate, db: Session = Depends(get_db), current = Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    # calcula total
    total = Decimal("0.00")
    items_models = []
    for item in data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id, models.Product.active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produto {item.product_id} não encontrado")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
        line_total = Decimal(product.price) * item.quantity
        total += line_total

    order = models.Order(
        user_id=current.id,
        status=models.OrderStatus.paid,  # simplificado: já marca como pago
        total_amount=total,
    )
    db.add(order)
    db.flush()  # gera ID

    # criar items e atualizar stock
    for item in data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        oi = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
        )
        db.add(oi)
        product.stock -= item.quantity

    # pontos
    max_points = calcular_max_desconto_pontos(current, total)
    points_to_use = min(max_points, data.points_to_use)
    discount_amount = Decimal(points_to_use)
    if points_to_use > 0:
        usar_pontos(db, current, points_to_use, "Uso de pontos na compra", order.id)

    order.discount_amount = discount_amount
    order.points_used = points_to_use

    payable = total - discount_amount
    points_earned = calcular_pontos_ganhos(current, payable)
    adicionar_pontos(db, current, points_earned, "Pontos por compra", order.id)
    order.points_earned = points_earned

    # comissões
    criar_comissoes_para_order(db, order)

    db.commit()
    db.refresh(order)
    return order

@router.get("/me", response_model=List[schemas.OrderOut])
def my_orders(db: Session = Depends(get_db), current = Depends(get_current_user)):
    orders = db.query(models.Order).filter(models.Order.user_id == current.id).order_by(models.Order.created_at.desc()).all()
    return orders
