import { Link } from "react-router-dom"
import { useMemo } from "react"
import { useCart } from "../store/cartStore"

export default function CartPreviewSticky() {
  const { items } = useCart()

  const count = useMemo(
    () => items.reduce((acc, it) => acc + (it.quantity || 0), 0),
    [items]
  )

  // ✅ subtotal calculado diretamente pelos itens (evita total=0 do store)
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity || 0), 0),
    [items]
  )

  // ✅ não aparece se estiver vazio
  if (!items || items.length === 0) return null

  // ✅ mostra só alguns itens para não ficar gigante
  const preview = items.slice(0, 4)
  const remaining = items.length - preview.length

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[92vw]">
      <div className="bg-slate-950/95 backdrop-blur border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-sm font-semibold">
            Carrinho <span className="text-slate-400 font-normal">• {count} item(ns)</span>
          </div>

          <Link to="/cart" className="text-xs text-emerald-400 hover:text-emerald-300">
            Abrir
          </Link>
        </div>

        {/* Lista */}
        <div className="px-4 py-3 space-y-2">
          {preview.map((it) => (
            <div key={it.product_id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-xs text-slate-400">
                  {Number(it.price).toFixed(2)} MT × {it.quantity}
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-200 shrink-0">
                {(Number(it.price) * Number(it.quantity)).toFixed(2)} MT
              </div>
            </div>
          ))}

          {remaining > 0 && (
            <div className="text-xs text-slate-500 pt-1">
              + {remaining} produto(s) no carrinho…
            </div>
          )}
        </div>

        {/* Rodapé com subtotal */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400">Subtotal</div>
            <div className="text-base font-bold text-emerald-400">
              {Number(subtotal).toFixed(2)} MT
            </div>
          </div>

          <Link
            to="/cart"
            className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
          >
            Pagar
          </Link>
        </div>
      </div>
    </div>
  )
}