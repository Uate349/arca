import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../store/authStore'

type AdminProduct = {
  id: string
  name: string
  price?: number | string | null
  cost_price?: number | string | null
  stock?: number | string | null
  active: boolean
  image_url?: string | null
  created_at?: string
}

type EditForm = {
  id: string | null // ✅ agora pode ser null para "Novo produto"
  name: string
  price: string
  cost_price: string
  stock: string
  active: boolean
  image_url: string
}

export default function AdminProductsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [q, setQ] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)

  const apiBase = import.meta.env.VITE_API_URL

  // 🔐 conversão segura (evita NaN)
  const n = (v: any) => {
    const x = Number(v)
    return Number.isFinite(x) ? x : 0
  }

  async function load() {
    try {
      setLoading(true)
      setError(null)

      if (!token) {
        setError('Precisa estar autenticado como ADMIN.')
        return
      }

      const res = await fetch(`${apiBase}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar produtos')

      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.products ?? [])
      setProducts(list)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar produtos')
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
    if (!s) return products
    return products.filter((p) => {
      const name = (p.name ?? '').toString().toLowerCase()
      const id = (p.id ?? '').toString().toLowerCase()
      return name.includes(s) || id.includes(s)
    })
  }, [products, q])

  // ✅ NOVO: abrir modal para criar produto
  function openCreate() {
    setForm({
      id: null,
      name: '',
      price: '0.00',
      cost_price: '0.00', // ✅ NOVO
      stock: '0',
      active: true,
      image_url: '',
    })
    setEditOpen(true)
  }

  function openEdit(p: AdminProduct) {
    setForm({
      id: p.id,
      name: p.name ?? '',
      price: n(p.price).toFixed(2),
      cost_price: n(p.cost_price).toFixed(2), // ✅ NOVO
      stock: String(n(p.stock)),
      active: !!p.active,
      image_url: (p.image_url ?? '').toString(),
    })
    setEditOpen(true)
  }

  function closeEdit() {
    setEditOpen(false)
    setForm(null)
  }

  async function toggleActive(p: AdminProduct) {
    if (!token) return
    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`${apiBase}/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !p.active }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar produto')

      const updated = await res.json()
      const u: AdminProduct = updated.product ?? updated

      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...u } : x)))
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar produto')
    } finally {
      setSaving(false)
    }
  }

  // ✅ agora serve para EDITAR e CRIAR
  async function saveEdit() {
    if (!token || !form) return
    try {
      setSaving(true)
      setError(null)

      const payload = {
        name: form.name.trim(),
        price: n(form.price),
        cost_price: n(form.cost_price), // ✅ NOVO (admin only)
        stock: n(form.stock),
        active: form.active,
        image_url: form.image_url?.trim() || null,
      }

      const isCreate = !form.id

      const res = await fetch(
        isCreate ? `${apiBase}/admin/products` : `${apiBase}/admin/products/${form.id}`,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        // tenta mostrar mensagem real do backend (se houver)
        let msg = isCreate ? 'Falha ao criar produto' : 'Falha ao salvar edição'
        try {
          const j = await res.json()
          msg = j?.detail || j?.message || msg
        } catch {}
        throw new Error(msg)
      }

      const out = await res.json()
      const u: AdminProduct = out.product ?? out

      if (isCreate) {
        // adiciona na lista (ou recarrega, se preferires)
        setProducts((prev) => [u, ...prev])
      } else {
        setProducts((prev) => prev.map((x) => (x.id === form.id ? { ...x, ...u } : x)))
      }

      closeEdit()
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin • Produtos</h1>

        <div className="flex gap-2">
          {/* ✅ NOVO botão */}
          <button
            onClick={openCreate}
            disabled={loading || saving}
            className="px-3 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
          >
            Novo produto
          </button>

          <button
            onClick={load}
            disabled={loading || saving}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm hover:border-slate-600 disabled:opacity-60"
          >
            Recarregar
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div className="text-sm text-slate-400">{loading ? 'Carregando…' : `${filtered.length} produto(s)`}</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar por nome ou ID…"
          className="w-full md:w-80 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* ✅ Ajustei o grid para caber "Custo" */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-slate-400 border-b border-slate-800">
            <div className="col-span-4">Produto</div>
            <div className="col-span-2">Preço</div>
            <div className="col-span-2">Custo</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-400">Sem produtos.</div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-slate-800 last:border-b-0 items-center"
              >
                <div className="col-span-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{p.id}</div>
                </div>

                <div className="col-span-2 text-emerald-400">{n(p.price).toFixed(2)} MT</div>

                {/* ✅ Custo (só admin) */}
                <div className="col-span-2 text-slate-300">{n(p.cost_price).toFixed(2)} MT</div>

                <div className="col-span-1">{n(p.stock)}</div>

                <div className="col-span-1">
                  <span
                    className={
                      p.active
                        ? 'text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20'
                    }
                  >
                    {p.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs hover:border-slate-600 disabled:opacity-60"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => toggleActive(p)}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs hover:border-slate-600 disabled:opacity-60"
                  >
                    {p.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal criar/editar */}
      {editOpen && form && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{form.id ? 'Editar produto' : 'Novo produto'}</div>
                {form.id && <div className="text-xs text-slate-500 font-mono">{form.id}</div>}
              </div>

              <button
                onClick={closeEdit}
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs hover:border-slate-600 disabled:opacity-60"
              >
                Fechar
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Preço (MT)</label>
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                  inputMode="decimal"
                />
              </div>

              {/* ✅ NOVO: Custo (só admin) */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Custo (MT) — apenas Admin</label>
                <input
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Stock</label>
                <input
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-400">Imagem (URL)</label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <label htmlFor="active" className="text-sm">
                  Produto ativo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeEdit}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm hover:border-slate-600 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !form.name.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
              >
                {saving ? 'Salvando…' : form.id ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}