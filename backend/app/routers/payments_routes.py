from decimal import Decimal
from fastapi import APIRouter
from pydantic import BaseModel
from ..services.payments_service import criar_payment_intent, simular_confirmacao_pagamento

router = APIRouter()

class PaymentRequest(BaseModel):
    amount: Decimal
    method: str  # "mpesa" | "emola" | "bank"

@router.post("/intent")
def create_payment_intent(data: PaymentRequest):
    intent = criar_payment_intent(data.amount, data.method)  # type: ignore[arg-type]
    # Em ambiente real, retornaria URL de pagamento ou instruções USSD
    return {
        "reference": intent.reference,
        "status": intent.status,
        "method": intent.method,
        "amount": str(intent.amount),
    }

@router.post("/confirm")
def confirm_payment(data: PaymentRequest):
    intent = criar_payment_intent(data.amount, data.method)  # dummy
    intent = simular_confirmacao_pagamento(intent)
    return {
        "reference": intent.reference,
        "status": intent.status,
        "method": intent.method,
        "amount": str(intent.amount),
    }
