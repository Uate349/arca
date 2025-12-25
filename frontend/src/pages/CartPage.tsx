import { Link } from 'react-router-dom'
import { useCart } from '../store/cartStore'

export default function CartPage() {
  const { items, removeFromCart } = useCart()

  const totalCalc = items.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Carrinho</h1>
      {items.length === 0 ? (
        <div className="text-sm">
          Seu carrinho está vazio.{' '}
          <Link to="/" className="text-emerald-400">
            Voltar à loja
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div
              key={i.product_id}
              className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3"
            >
              <div>
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-slate-400">
                  {i.quantity} x {Number(i.price).toFixed(2)} MT
                </div>
              </div>
              <button
                onClick={() => removeFromCart(i.product_id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remover
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-emerald-400">
              {totalCalc.toFixed(2)} MT
            </span>
          </div>

          <Link
            to="/checkout"
            className="inline-flex px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
          >
            Finalizar compra
          </Link>
        </div>
      )}
    </div>
  )
}