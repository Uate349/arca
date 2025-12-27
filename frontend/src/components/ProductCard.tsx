import { useMemo, useState } from 'react'
import { CartItem, useCart } from '../store/cartStore'

interface Props {
  product: any
  onAddToCart: (item: CartItem) => void
}

export default function ProductCard({ product, onAddToCart }: Props) {
  const { items } = useCart()

  // ✅ quantidade deste produto no carrinho (por product_id)
  const qtyInCart = useMemo(() => {
    const it = items?.find((i: any) => i.product_id === product.id)
    return it?.quantity ?? 0
  }, [items, product.id])

  // ✅ feedback rápido quando clica
  const [pulse, setPulse] = useState(false)

  function handleAdd() {
    onAddToCart({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
    })

    setPulse(true)
    window.setTimeout(() => setPulse(false), 500)
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

        <button
          onClick={handleAdd}
          className="relative px-3 py-1 rounded-lg bg-emerald-500 text-slate-900 text-xs font-semibold hover:bg-emerald-400"
        >
          Adicionar
          {/* ✅ mini contador no botão (opcional, mas ajuda) */}
          {qtyInCart > 0 && (
            <span className="ml-2 inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-700">
              {qtyInCart}
            </span>
          )}
        </button>
      </div>

      {/* ✅ feedback visual "+1" */}
      {pulse && (
        <div className="absolute bottom-3 right-3 text-[11px] px-2 py-1 rounded-full bg-slate-950 border border-slate-700">
          +1
        </div>
      )}
    </div>
  )
}