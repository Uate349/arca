import { useEffect, useState } from 'react'
import { useAuth } from '../store/authStore'
import { fetchMyCommissions } from '../api/commissionsApi'
import { fetchMyPayouts } from '../api/payoutsApi'

export default function ConsultantDashboardPage() {
  const { token, user } = useAuth()
  const [commissions, setCommissions] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (token) {
        const c = await fetchMyCommissions(token)
        const p = await fetchMyPayouts(token)
        setCommissions(c)
        setPayouts(p)
      }
    }
    load().catch(console.error)
  }, [token])

  if (!token) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Painel do consultor</h1>
        <p className="text-sm text-slate-400">Entre na sua conta para ver ganhos e comissões.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Painel do consultor</h1>
        <p className="text-xs text-slate-400">
          Veja suas comissões acumuladas, pagamentos mensais e desempenho geral na rede ARCA.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Perfil</div>
          <div className="font-semibold">{user?.name}</div>
          <div className="text-xs text-slate-400 mt-1">Papel: {user?.role}</div>
        </div>
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Total de comissões</div>
          <div className="text-xl font-bold text-emerald-400">
            {commissions.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2)} MT
          </div>
        </div>
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Pagamentos gerados</div>
          <div className="text-xl font-bold text-emerald-400">{payouts.length}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Comissões por venda</h2>
          <div className="space-y-2 max-h-64 overflow-auto text-xs">
            {commissions.map((c) => (
              <div key={c.id} className="flex justify-between border-b border-slate-800 pb-1">
                <div>
                  <div>#{c.order_id.slice(0, 8)}</div>
                  <div className="text-[10px] text-slate-500">Tipo: {c.type}</div>
                </div>
                <div className="font-semibold text-emerald-400">{Number(c.amount).toFixed(2)} MT</div>
              </div>
            ))}
            {commissions.length === 0 && <div className="text-slate-500">Nenhuma comissão ainda.</div>}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Pagamentos mensais (payouts)</h2>
          <div className="space-y-2 max-h-64 overflow-auto text-xs">
            {payouts.map((p) => (
              <div key={p.id} className="flex justify-between border-b border-slate-800 pb-1">
                <div>
                  <div>Período</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(p.period_start).toLocaleDateString()} - {new Date(p.period_end).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-400">{Number(p.amount).toFixed(2)} MT</div>
                  <div className="text-[10px] text-slate-500 uppercase">{p.status}</div>
                </div>
              </div>
            ))}
            {payouts.length === 0 && <div className="text-slate-500">Nenhum pagamento gerado ainda.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
