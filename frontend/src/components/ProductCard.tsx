import { useMemo, useState } from "react"
import { CartItem, useCart } from "../store/cartStore"

interface Props {
  product: any
  onAddToCart: (item: CartItem) => void
}

export default function ProductCard({ product, onAddToCart }: Props) {
  const { items, decrementFromCart } = useCart()

  // ✅ stock seguro (não quebra se vier string/undefined)
  const stock = useMemo(() => {
    const n = Number(product?.stock ?? 0)
    return Number.isFinite(n) ? Math.max(0, n) : 0
  }, [product?.stock])

  const soldOut = stock <= 0

  // ✅ quantidade deste produto no carrinho (por product_id)
  const qtyInCart = useMemo(() => {
    const it = items?.find((i: any) => i.product_id === product.id)
    return Number(it?.quantity ?? 0)
  }, [items, product.id])

  // ✅ se já atingiu o máximo do stock
  const atMax = !soldOut && qtyInCart >= stock

  // ✅ feedback rápido quando clica
  const [pulse, setPulse] = useState<null | "+1" | "-1">(null)

  function handleAdd() {
    // ✅ bloqueia adicionar se esgotado ou já no limite
    if (soldOut || atMax) return

    onAddToCart({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
    })

    setPulse("+1")
    window.setTimeout(() => setPulse(null), 500)
  }

  // ✅ diminui 1 de verdade: 5->4->3->2->1->0
  function handleMinus() {
    if (qtyInCart <= 0) return
    decrementFromCart(product.id)

    setPulse("-1")
    window.setTimeout(() => setPulse(null), 500)
  }

  return (
    <div className="relative bg-slate-900 rounded-xl p-4 flex flex-col gap-3 border border-slate-800">
      {/* ✅ Badge de quantidade no item */}
      {qtyInCart > 0 && (
        <div className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded-full bg-emerald-500 text-slate-900 font-semibold">
          Qtd: {qtyInCart}
        </div>
      )}

      {/* ✅ Badge Esgotado */}
      {soldOut && (
        <div className="absolute top-3 left-3 text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
          Esgotado
        </div>
      )}

      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-40 object-cover rounded-lg"
        />
      )}

      <div className="flex-1">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>

        {/* ✅ Stock (profissional) */}
        <div className="mt-2 text-[11px]">
          {soldOut ? (
            <span className="inline-flex items-center gap-2 text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Esgotado
            </span>
          ) : stock <= 5 ? (
            <span className="inline-flex items-center gap-2 text-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              Baixo stock: <b>{stock}</b>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Em stock
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-400">
          {Number(product.price).toFixed(2)} MT
        </span>

        {/* ✅ Opção A: se qty>0, vira controle - qty + */}
        {qtyInCart > 0 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMinus}
              className="w-8 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold hover:border-slate-600"
              aria-label="Diminuir"
              title="Diminuir"
            >
              -
            </button>

            <div className="min-w-[52px] text-center text-xs font-semibold text-slate-200">
              Qtd: {qtyInCart}
            </div>

            <button
              onClick={handleAdd}
              disabled={soldOut || atMax}
              className={`w-8 h-7 rounded-lg text-xs font-bold
                ${
                  soldOut || atMax
                    ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                }`}
              aria-label="Aumentar"
              title={soldOut ? "Esgotado" : atMax ? `Máximo: ${stock}` : "Aumentar"}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className={`px-3 py-1 rounded-lg text-xs font-semibold
              ${
                soldOut
                  ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
              }`}
            title={soldOut ? "Esgotado" : "Adicionar"}
          >
            {soldOut ? "Esgotado" : "Adicionar"}
          </button>
        )}
      </div>

      {/* ✅ feedback visual */}
      {pulse && (
        <div className="absolute bottom-3 right-3 text-[11px] px-2 py-1 rounded-full bg-slate-950 border border-slate-700">
          {pulse}
        </div>
      )}
    </div>
  )
}