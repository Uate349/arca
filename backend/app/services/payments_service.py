from decimal import Decimal
from datetime import datetime
from typing import Literal

# Aqui ficam apenas "stubs" / estrutura para futuras integrações reais
# com M-Pesa, Emola ou banco. Você depois troca estes métodos pelas SDKs reais.

PaymentMethod = Literal["mpesa", "emola", "bank"]

class PaymentIntent:
    def __init__(self, amount: Decimal, method: PaymentMethod):
        self.amount = amount
        self.method = method
        self.reference = f"{method.upper()}-{int(datetime.utcnow().timestamp())}"
        self.status = "pending"  # pending, confirmed, failed

def criar_payment_intent(amount: Decimal, method: PaymentMethod) -> PaymentIntent:
    # Em produção, aqui você chamaria a API real (M-Pesa / Emola / Banco)
    return PaymentIntent(amount, method)

def simular_confirmacao_pagamento(intent: PaymentIntent) -> PaymentIntent:
    # Em prod, isso viria de webhook/consulta ao PSP
    intent.status = "confirmed"
    return intent
