import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../store/authStore"
import { fetchMyCommissions, fetchMyCommissionSummary } from "../api/commissionsApi"
import { fetchMyPayouts } from "../api/payoutsApi"

function money(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

function safeSlice(v: any, n = 8) {
  const s = String(v ?? "")
  return s.length > n ? s.slice(0, n) : s
}

function safeDate(v: any) {
  if (!v) return "-"
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString()
}

export default function ConsultantDashboardPage() {
  const { token, user } = useAuth()

  const [commissions, setCommissions] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [summary, setSummary] = useState<any | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalFromList = useMemo(() => {
    return commissions.reduce((sum, c) => sum + Number(c?.amount ?? 0), 0)
  }, [commissions])

  const total = useMemo(() => {
    // ✅ preferir summary se existir
    const s = summary?.total
    return s != null ? Number(s) : totalFromList
  }, [summary, totalFromList])

  const paidTotal = useMemo(() => {
    const s = summary?.paid_total
    return s != null
      ? Number(s)
      : commissions
          .filter((c) => c?.paid)
          .reduce((sum, c) => sum + Number(c?.amount ?? 0), 0)
  }, [summary, commissions])

  const byStatus = summary?.by_status ?? {}

  useEffect(() => {
    async function load() {
      if (!token) return
      setLoading(true)
      setError(null)

      try {
        // ✅ não deixa o summary derrubar o painel
        const [c, p] = await Promise.all([
          fetchMyCommissions(token, { limit: 200, offset: 0 }),
          fetchMyPayouts(token, { limit: 200, offset: 0 }),
        ])

        setCommissions(Array.isArray(c) ? c : [])
        setPayouts(Array.isArray(p) ? p : [])

        // ✅ summary agora é calculado sem endpoint extra
        const s = await fetchMyCommissionSummary(token, { limit: 200, offset: 0 })
        setSummary(s ?? null)
      } catch (e: any) {
        // ✅ mostra erro real (ajuda a diagnosticar)
        const msg = String(e?.message || "")
        setError(msg ? `Falha ao carregar: ${msg}` : "Falha ao carregar o painel do consultor.")
      } finally {
        setLoading(false)
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Painel do consultor</h1>
          <p className="text-xs text-slate-400">
            Veja suas comissões acumuladas, pagamentos mensais e desempenho geral na rede ARCA.
          </p>
        </div>

        {loading ? <div className="text-xs text-slate-400">A carregar...</div> : null}
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Perfil</div>
          <div className="font-semibold">{user?.name ?? "-"}</div>
          <div className="text-xs text-slate-400 mt-1">Papel: {user?.role ?? "-"}</div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Total de comissões</div>
          <div className="text-xl font-bold text-emerald-400">{money(total)} MT</div>

          {/* ✅ extra profissional: totais por status */}
          {summary?.by_status ? (
            <div className="mt-2 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Paid</span>
                <span className="text-slate-200">{money(paidTotal)} MT</span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="text-slate-200">{money(byStatus.pending)} MT</span>
              </div>
              <div className="flex justify-between">
                <span>Eligible</span>
                <span className="text-slate-200">{money(byStatus.eligible)} MT</span>
              </div>
              <div className="flex justify-between">
                <span>Locked</span>
                <span className="text-slate-200">{money(byStatus.locked)} MT</span>
              </div>
              <div className="flex justify-between">
                <span>Void</span>
                <span className="text-slate-200">{money(byStatus.void)} MT</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Pagamentos gerados</div>
          <div className="text-xl font-bold text-emerald-400">{payouts.length}</div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Comissões por venda</h2>

          <div className="space-y-2 max-h-64 overflow-auto text-xs">
            {commissions.map((c) => (
              <div key={c.id} className="flex justify-between border-b border-slate-800 pb-1">
                <div>
                  <div>#{safeSlice(c.order_id, 8)}</div>
                  <div className="text-[10px] text-slate-500">
                    Tipo: {String(c.type ?? "-")} • Status:{" "}
                    {String(c.status ?? (c.paid ? "paid" : "pending"))}
                  </div>
                  <div className="text-[10px] text-slate-600">{c.created_at ? safeDate(c.created_at) : ""}</div>
                </div>

                <div className="font-semibold text-emerald-400">{money(c.amount)} MT</div>
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
                    {safeDate(p.period_start)} - {safeDate(p.period_end)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-emerald-400">{money(p.amount)} MT</div>
                  <div className="text-[10px] text-slate-500 uppercase">{String(p.state ?? p.status ?? "-")}</div>
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