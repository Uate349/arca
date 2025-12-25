import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../store/cartStore'
import { useAuth } from '../store/authStore'
import { createOrder } from '../api/ordersApi'

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const { token } = useAuth()
  const [pointsToUse, setPointsToUse] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const totalCalc = items.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) {
      setError('Precisa estar autenticado para finalizar.')
      return
    }
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        points_to_use: pointsToUse,
      }
      await createOrder(token, payload)
      clearCart()
      navigate('/account')
    } catch (err: any) {
      setError('Erro ao finalizar compra')
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
              <span>{i.name} (x{i.quantity})</span>
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
          />
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
        >
          Confirmar compra
        </button>
      </form>
    </div>
  )
}
