import api from "./apiClient"

export async function createOrder(
  token: string,
  payload: {
    items: { product_id: string; quantity: number }[]
    points_to_use: number
    consultant_id?: string
    ref_source?: string
  }
) {
  const res = await api.post("/orders/", payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

/**
 * ✅ Confirmar pagamento de um pedido
 * Backend real (Swagger):
 * - POST /payments/confirm
 *
 * ⚠️ OBS: o backend exige "amount" no body (Field required).
 */
export async function confirmOrderPayment(
  token: string,
  orderId: string,
  amount: number,
  method: "mpesa" | "emola" | "bank" = "mpesa",
  reference?: string
) {
  const res = await api.post(
    "/payments/confirm",
    {
      order_id: orderId,
      amount: Number(amount ?? 0),
      method,
      reference,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  return res.data
}

export async function fetchMyOrders(token: string) {
  const res = await api.get("/orders/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}