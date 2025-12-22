import { useEffect, useState } from 'react'
import { useAuth } from '../store/authStore'
import { getMe } from '../api/authApi'
import { fetchMyOrders } from '../api/ordersApi'
import PointsBadge from '../components/PointsBadge'

export default function AccountPage() {
  const { token, user, setUser, logout } = useAuth()
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (token) {
        const me = await getMe(token)
        setUser(me)
        const ords = await fetchMyOrders(token)
        setOrders(ords)
      }
    }
    load().catch(console.error)
  }, [token])

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-sm">Você não está autenticado.</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <button
          onClick={logout}
          className="px-3 py-1 rounded-lg bg-red-500 text-slate-900 text-xs font-semibold hover:bg-red-400"
        >
          Sair
        </button>
      </div>
      {user && (
        <PointsBadge points={user.points_balance} level={user.level} />
      )}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Minhas compras</h2>
        <div className="space-y-2 text-sm">
          {orders.map((o) => (
            <div key={o.id} className="bg-slate-900 rounded-lg px-4 py-3 border border-slate-800">
              <div className="flex justify-between">
                <span>#{o.id.slice(0, 8)}</span>
                <span className="text-xs uppercase">{o.status}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Total</span>
                <span>{Number(o.total_amount).toFixed(2)} MT</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Desconto em pontos</span>
                <span>{Number(o.discount_amount).toFixed(2)} MT</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Pontos ganhos</span>
                <span>{o.points_earned}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="text-xs text-slate-400">Nenhuma compra ainda.</div>}
        </div>
      </div>
    </div>
  )
}
