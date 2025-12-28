import { FormEvent, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../store/cartStore"
import { useAuth } from "../store/authStore"
import { createOrder } from "../api/ordersApi"

type StockIssue = {
  product_id: string | number
  name?: string
  available: number
  requested: number
}

function getItemAvailableStock(i: any): number | null {
  // tenta campos comuns sem quebrar (se não existir, retorna null)
  const raw =
    i?.stock ??
    i?.available ??
    i?.inventory ??
    i?.qty_stock ??
    i?.available_stock ??
    i?.in_stock

  if (raw === undefined || raw === null) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return Math.max(0, n)
}

function extractBackendStockIssues(err: any): StockIssue[] | null {
  // Compatível com axios/fetch/erros diversos
  const data =
    err?.response?.data ??
    err?.data ??
    err?.body ??
    err?.error ??
    null

  const status = err?.response?.status ?? err?.status ?? null

  // 1) formato ideal: 409 + { detail: "Sem stock", items: [...] }
  if (status === 409 && data && Array.isArray(data.items)) {
    return data.items.map((x: any) => ({
      product_id: x.product_id ?? x.productId ?? x.id ?? "unknown",
      name: x.name ?? x.product_name ?? x.productName,
      available: Number(x.available ?? x.stock ?? 0) || 0,
      requested: Number(x.requested ?? x.quantity ?? 0) || 0,
    }))
  }

  // 2) fallback por texto (detail/message)
  const msg = String(
    data?.detail ?? data?.message ?? err?.message ?? ""
  ).toLowerCase()

  if (msg.includes("sem stock") || msg.includes("out of stock") || msg.includes("stock")) {
    // não temos lista detalhada; devolve “genérico”
    return [
      {
        product_id: "unknown",
        name: undefined,
        available: 0,
        requested: 0,
      },
    ]
  }

  return null
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const { token } = useAuth()
  const [pointsToUse, setPointsToUse] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stockIssuesFromBackend, setStockIssuesFromBackend] = useState<StockIssue[] | null>(null)
  const navigate = useNavigate()

  const totalCalc = useMemo(() => {
    return items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
  }, [items])

  // ✅ Detecta falta de stock local (SE o item tiver campo de stock)
  const localStockIssues: StockIssue[] = useMemo(() => {
    const issues: StockIssue[] = []

    for (const i of items) {
      const available = getItemAvailableStock(i)
      if (available === null) continue // não temos info de stock no carrinho → não bloqueia
      const requested = Number(i.quantity ?? 0)
      if (requested > available) {
        issues.push({
          product_id: i.product_id,
          name: i.name,
          available,
          requested,
        })
      }
    }

    return issues
  }, [items])

  const shouldBlockSubmit = localStockIssues.length > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setStockIssuesFromBackend(null)

    // ✅ bloqueia se já sabemos que falta stock
    if (shouldBlockSubmit) {
      setError("Alguns itens excedem o stock disponível. Ajuste o carrinho para continuar.")
      return
    }

    if (!token) {
      setError("Precisa estar autenticado para finalizar.")
      return
    }

    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        points_to_use: pointsToUse,
      }

      await createOrder(token, payload)
      clearCart()
      navigate("/account")
    } catch (err: any) {
      const issues = extractBackendStockIssues(err)

      if (issues) {
        setStockIssuesFromBackend(issues)
        // mensagem amigável
        setError("Sem stock em alguns produtos.")
      } else {
        setError("Erro ao finalizar compra")
      }
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

        {/* ✅ Aviso local de stock (se existir stock nos items) */}
        {localStockIssues.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <div className="font-semibold mb-1">Itens com stock insuficiente:</div>
            <ul className="list-disc pl-5 space-y-1">
              {localStockIssues.map((x) => (
                <li key={String(x.product_id)}>
                  <b>{x.name ?? "Produto"}</b>: disponível <b>{x.available}</b>, no carrinho <b>{x.requested}</b>
                </li>
              ))}
            </ul>
            <div className="mt-2 text-amber-200/90">
              Ajuste as quantidades no carrinho para poder confirmar.
            </div>
          </div>
        )}

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
          />
        </div>

        {/* ✅ Erro amigável + detalhes quando vem do backend */}
        {error && (
          <div className="text-xs text-red-300">
            {error}

            {stockIssuesFromBackend?.length ? (
              <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                <div className="font-semibold mb-1">Detalhes:</div>

                {/* Se veio “genérico”, não tem nome/available */}
                {stockIssuesFromBackend.length === 1 &&
                stockIssuesFromBackend[0].product_id === "unknown" ? (
                  <div>Sem stock (o servidor não enviou detalhes do produto).</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {stockIssuesFromBackend.map((x, idx) => (
                      <li key={idx}>
                        Produto <b>{x.name ?? x.product_id}</b> sem stock suficiente — disponível{" "}
                        <b>{x.available}</b>, solicitado <b>{x.requested}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={shouldBlockSubmit}
          className={`px-4 py-2 rounded-lg text-sm font-semibold
            ${shouldBlockSubmit ? "bg-slate-700 text-slate-300 cursor-not-allowed" : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"}`}
          title={shouldBlockSubmit ? "Ajuste as quantidades para continuar" : "Confirmar compra"}
        >
          Confirmar compra
        </button>
      </form>
    </div>
  )
}