import { FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../store/cartStore"
import { useAuth } from "../store/authStore"
import { createOrder, confirmOrderPayment } from "../api/ordersApi"

function getErrData(err: any) {
  // axios: err.response.data
  if (err?.response?.data) return err.response.data
  // fetch wrapper: err.data
  if (err?.data) return err.data
  return null
}

function getErrMessage(err: any) {
  const data = getErrData(err)
  const msg = String(data?.detail ?? data?.message ?? err?.message ?? "")
  return msg
}

function looksLikeStockError(msg: string) {
  const m = msg.toLowerCase()
  return m.includes("sem stock") || m.includes("out of stock") || m.includes("stock")
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const { token } = useAuth()
  const [pointsToUse, setPointsToUse] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stockDetails, setStockDetails] = useState<any[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const totalCalc = items.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setStockDetails(null)

    if (!token) {
      setError("Precisa estar autenticado para finalizar.")
      return
    }

    if (items.length === 0) {
      setError("Carrinho vazio.")
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        points_to_use: pointsToUse,
      }

      const order = await createOrder(token, payload)

      // ✅ simulação de pagamento (por enquanto)
      await confirmOrderPayment(token, order.id, "mpesa")

      clearCart()
      navigate("/account")
    } catch (err: any) {
      const data = getErrData(err)
      const msg = getErrMessage(err)

      // ✅ Se backend devolver algo tipo: { detail: "Sem stock", items: [...] }
      if (Array.isArray(data?.items)) {
        setStockDetails(data.items)
        setError("Sem stock em alguns produtos.")
        return
      }

      // ✅ se o backend devolver { detail: { detail: "Sem stock", items: [...] } }
      if (Array.isArray(data?.detail?.items)) {
        setStockDetails(data.detail.items)
        setError("Sem stock em alguns produtos.")
        return
      }

      // ✅ fallback: se o texto mencionar stock
      if (looksLikeStockError(msg)) {
        setError(msg || "Sem stock em alguns produtos.")
        return
      }

      setError("Erro ao finalizar compra")
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-sm">Carrinho vazio.</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-900 rounded-lg p-4 space-y-2">
          {items.map((i) => (
            <div key={i.product_id} className="flex justify-between text-sm">
              <span>
                {i.name} (x{i.quantity})
              </span>
              <span>{(Number(i.price) * Number(i.quantity)).toFixed(2)} MT</span>
            </div>
          ))}

          <div className="flex justify-between font-semibold border-t border-slate-800 pt-2">
            <span>Total</span>
            <span className="text-emerald-400">{totalCalc.toFixed(2)} MT</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Pontos a usar (máx 30% do valor)
          </label>
          <input
            type="number"
            min={0}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            value={pointsToUse}
            onChange={(e) => setPointsToUse(Number(e.target.value))}
            disabled={submitting}
          />
        </div>

        {/* ✅ Erro amigável + detalhes do backend (se existirem) */}
        {error && (
          <div className="text-xs text-red-300">
            {error}

            {stockDetails?.length ? (
              <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                <div className="font-semibold mb-1">Detalhes:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {stockDetails.map((x: any, idx: number) => (
                    <li key={idx}>
                      Produto <b>{x.name ?? x.product_name ?? x.productId ?? x.product_id}</b>{" "}
                      — disponível <b>{x.available ?? x.stock ?? 0}</b>, solicitado{" "}
                      <b>{x.requested ?? x.quantity ?? 0}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`px-4 py-2 rounded-lg text-slate-900 text-sm font-semibold
            ${submitting ? "bg-emerald-500/60 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400"}`}
        >
          {submitting ? "A processar..." : "Confirmar compra"}
        </button>
      </form>
    </div>
  )
}