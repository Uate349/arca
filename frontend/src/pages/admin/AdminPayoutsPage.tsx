import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../store/authStore'

type AdminPayout = {
  id: string
  user_id?: string | null
  user?: { id?: string; name?: string; phone?: string; email?: string } | null
  amount?: number | string | null
  status: string
  period_start?: string | null
  period_end?: string | null
  created_at?: string | null
}

export default function AdminPayoutsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<AdminPayout[]>([])
  const [q, setQ] = useState('')

  const apiBase = import.meta.env.VITE_API_URL

  const n = (v: any) => {
    const x = Number(v)
    return Number.isFinite(x) ? x : 0
  }

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '—' : d.toLocaleString()
  }

  async function load() {
    try {
      setLoading(true)
      setError(null)

      if (!token) {
        setError('Precisa estar autenticado como ADMIN.')
        return
      }

      const res = await fetch(`${apiBase}/admin/payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Falha ao carregar payouts')
      const data = await res.json()

      const list = Array.isArray(data) ? data : (data.payouts ?? [])
      setRows(list)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar payouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((p) => {
      const id = (p.id ?? '').toLowerCase()
      const st = (p.status ?? '').toLowerCase()
      const uid = (p.user_id ?? '').toLowerCase()
      const name = (p.user?.name ?? '').toLowerCase()
      const phone = (p.user?.phone ?? '').toLowerCase()
      const email = (p.user?.email ?? '').toLowerCase()
      return (
        id.includes(s) ||
        st.includes(s) ||
        uid.includes(s) ||
        name.includes(s) ||
        phone.includes(s) ||
        email.includes(s)
      )
    })
  }, [rows, q])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin • Payouts</h1>

        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm hover:border-slate-600 disabled:opacity-60"
        >
          Recarregar
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div className="text-sm text-slate-400">
          {loading ? 'Carregando…' : `${filtered.length} payout(s)`}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar por ID, status, user, telefone…"
          className="w-full md:w-96 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-slate-400 border-b border-slate-800">
            <div className="col-span-3">ID</div>
            <div className="col-span-3">Beneficiário</div>
            <div className="col-span-2">Período</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2 text-right">Valor</div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-400">Sem payouts.</div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-slate-800 last:border-b-0 items-center"
              >
                <div className="col-span-3">
                  <div className="font-mono text-xs break-all">{p.id}</div>
                  <div className="text-xs text-slate-500">{fmtDate(p.created_at)}</div>
                </div>

                <div className="col-span-3">
                  <div className="font-medium">
                    {p.user?.name || (p.user_id ? `User ${p.user_id}` : '—')}
                  </div>
                  <div className="text-xs text-slate-500">
                    {p.user?.phone || p.user?.email || '—'}
                  </div>
                </div>

                <div className="col-span-2 text-xs text-slate-300">
                  <div>{p.period_start ? fmtDate(p.period_start) : '—'}</div>
                  <div>{p.period_end ? fmtDate(p.period_end) : '—'}</div>
                </div>

                <div className="col-span-2">
                  <span
                    className={
                      (p.status || '').toLowerCase() === 'processed'
                        ? 'text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }
                  >
                    {p.status}
                  </span>
                </div>

                <div className="col-span-2 text-right text-emerald-400 font-semibold">
                  {n(p.amount).toFixed(2)} MT
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}