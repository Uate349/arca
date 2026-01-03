from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..deps import get_current_user
from ..services.points_service import (
    calcular_max_desconto_pontos,
    calcular_pontos_ganhos,
    adicionar_pontos,
    usar_pontos,
)
from ..services.payout_service import gerar_payout_para_order  # serviço de payout
from ..utils.pdf_generator import generate_order_pdf
from ..utils.printer import print_pdf
from ..services.payments import criar_payment_intent, PaymentIntent

router = APIRouter()


# ---------------- FUNÇÕES AUX ----------------
def _stock_conflict(items: List[dict]):
    """
    Resposta consistente e amigável para frontend em caso de falta de stock.
    """
    raise HTTPException(
        status_code=409,
        detail={"detail": "Sem stock", "items": items},
    )


# ---------------- CRIAÇÃO DE PEDIDO ----------------
@router.post("/", response_model=schemas.OrderOut)
def create_order(
    data: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    total = Decimal("0.00")
    stock_issues: List[dict] = []
    products_by_id = {}

    # valida stock e calcula total
    for item in data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id,
            models.Product.active == True
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produto {item.product_id} não encontrado")

        products_by_id[item.product_id] = product
        requested = int(item.quantity)
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

        total += Decimal(product.price) * requested

    if stock_issues:
        _stock_conflict(stock_issues)

    # Criação do pedido como PENDING
    order = models.Order(
        user_id=current.id,
        status=models.OrderStatus.pending,
        total_amount=total,
        discount_amount=Decimal("0.00"),
        points_used=0,
        points_earned=0,
    )
    db.add(order)
    db.flush()

    # Cria os itens do pedido e baixa stock
    for item in data.items:
        product = products_by_id[item.product_id]
        requested = int(item.quantity)
        db.add(models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=requested,
            unit_price=product.price
        ))
        product.stock = int(product.stock or 0) - requested

    # Pontos do cliente
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

    # PDF do pedido
    try:
        order_dict = {
            "id": order.id,
            "delivery_address": getattr(data, "delivery_address", None),
            "items": [{"name": i.product.name, "quantity": i.quantity, "price": str(i.unit_price)}
                      for i in order.items],
            "total_amount": str(order.total_amount),
        }
        pdf_file = generate_order_pdf(order_dict)
        print_pdf(pdf_file)
    except Exception as e:
        print(f"Erro ao gerar/imprimir PDF: {e}")

    return order


# ---------------- MINHAS ORDENS ----------------
@router.get("/me", response_model=List[schemas.OrderOut])
def my_orders(db: Session = Depends(get_db), current=Depends(get_current_user)):
    orders = db.query(models.Order).filter(models.Order.user_id == current.id)\
        .order_by(models.Order.created_at.desc()).all()
    return orders


# ---------------- CONFIRMAÇÃO DE PAGAMENTO ----------------
@router.post("/{order_id}/confirm_payment", response_model=schemas.OrderOut)
def confirm_payment(
    order_id: str,
    amount: Decimal,
    method: str,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if order.status == models.OrderStatus.paid:
        return order  # já pago

    # criar PaymentIntent (stub real)
    intent = criar_payment_intent(amount, method)
    intent.status = "confirmed"  # simulação imediata, em prod webhook atualiza

    if intent.status != "confirmed":
        raise HTTPException(status_code=400, detail="Pagamento não confirmado")

    # atualiza pedido
    order.status = models.OrderStatus.paid
    order.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    # gerar payout automático
    gerar_payout_para_order(db, order)

    return order


# ---------------- WEBHOOK OPERADOR ----------------
@router.post("/webhook", response_model=schemas.PaymentWebhookOut)
def payment_webhook(data: schemas.PaymentWebhookIn, db: Session = Depends(get_db)):
    # busca pedido
    order = db.query(models.Order).filter(models.Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if order.status == models.OrderStatus.paid:
        return schemas.PaymentWebhookOut(
            message="Pedido já pago",
            order_id=order.id,
            amount_to_admin=Decimal("0.00"),
            amount_to_system=Decimal("0.00")
        )

    # valida valor pago
    esperado = order.total_amount - order.discount_amount
    if data.amount_paid != esperado:
        raise HTTPException(status_code=400, detail=f"Valor recebido ({data.amount_paid}) diferente do esperado ({esperado})")

    # atualiza status do pedido
    order.status = models.OrderStatus.paid
    order.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    # gerar payout automático
    payout = gerar_payout_para_order(db, order)

    return schemas.PaymentWebhookOut(
        message="Pagamento confirmado via operador",
        order_id=order.id,
        amount_to_admin=payout.amount if payout else Decimal("0.00"),
        amount_to_system=payout.amount if payout else Decimal("0.00")
    )