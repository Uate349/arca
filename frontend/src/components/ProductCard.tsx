import { useMemo, useState } from 'react'
import { CartItem, useCart } from '../store/cartStore'

interface Props {
  product: any
  onAddToCart: (item: CartItem) => void
}

export default function ProductCard({ product, onAddToCart }: Props) {
  const cart: any = useCart()
  const { items } = cart

  // ✅ quantidade deste produto no carrinho (por product_id)
  const qtyInCart = useMemo(() => {
    const it = items?.find((i: any) => i.product_id === product.id)
    return it?.quantity ?? 0
  }, [items, product.id])

  // ✅ feedback rápido quando clica
  const [pulse, setPulse] = useState<null | '+1' | '-1'>(null)

  function handleAdd() {
    onAddToCart({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
    })

    setPulse('+1')
    window.setTimeout(() => setPulse(null), 500)
  }

  // ✅ diminuir 1 sem quebrar: tenta várias funções do store
  function handleMinus() {
    if (qtyInCart <= 0) return

    const nextQty = Math.max(0, qtyInCart - 1)

    // 1) decrement (ideal)
    if (typeof cart.decrementItem === 'function') cart.decrementItem(product.id)
    else if (typeof cart.decrement === 'function') cart.decrement(product.id)
    else if (typeof cart.decreaseQty === 'function') cart.decreaseQty(product.id)
    else if (typeof cart.removeOne === 'function') cart.removeOne(product.id)

    // 2) update quantity
    else if (typeof cart.updateQuantity === 'function') cart.updateQuantity(product.id, nextQty)
    else if (typeof cart.setQuantity === 'function') cart.setQuantity(product.id, nextQty)
    else if (typeof cart.updateQty === 'function') cart.updateQty(product.id, nextQty)

    // 3) fallback: remove (pode remover tudo — mas não quebra)
    else if (typeof cart.removeFromCart === 'function') cart.removeFromCart(product.id)

    setPulse('-1')
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

      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-lg" />
      )}

      <div className="flex-1">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-400">{Number(product.price).toFixed(2)} MT</span>

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
              className="w-8 h-7 rounded-lg bg-emerald-500 text-slate-900 text-xs font-bold hover:bg-emerald-400"
              aria-label="Aumentar"
              title="Aumentar"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-900 text-xs font-semibold hover:bg-emerald-400"
          >
            Adicionar
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