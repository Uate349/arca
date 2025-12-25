import { useEffect, useState } from 'react'
import { useAuth } from '../../store/authStore'

type AdminOrder = {
  id: string
  status: string
  total: number
  points_discount: number
  created_at?: string
}

export default function AdminOrdersPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>([])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        if (!token) {
          setError('Precisa estar autenticado como ADMIN.')
          return
        }

        // ⚠️ Troca a URL para o teu endpoint real do backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Falha ao carregar pedidos')
        const data = await res.json()

        // aceita {orders: []} ou [] direto
        const list = Array.isArray(data) ? data : (data.orders ?? [])
        setOrders(list)
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar pedidos')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin • Pedidos</h1>
      </div>

      {loading && <div className="text-sm text-slate-400">Carregando…</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-3 text-xs text-slate-400 border-b border-slate-800">
            <div>ID</div>
            <div>Status</div>
            <div>Total</div>
            <div>Desc. pontos</div>
            <div>Data</div>
          </div>

          {orders.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-400">Sem pedidos.</div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-5 gap-2 px-4 py-3 text-sm border-b border-slate-800 last:border-b-0"
              >
                <div className="font-mono text-xs">{o.id}</div>
                <div>{o.status}</div>
                <div className="text-emerald-400">{Number(o.total).toFixed(2)} MT</div>
                <div>{Number(o.points_discount || 0).toFixed(2)} MT</div>
                <div className="text-xs text-slate-400">
                  {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}