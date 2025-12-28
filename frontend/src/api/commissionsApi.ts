import api from "./apiClient"

function resolveToken(token?: string) {
  return token || localStorage.getItem("arca_token") || ""
}

export async function fetchMyCommissions(
  token: string,
  params?: { status?: string; limit?: number; offset?: number }
) {
  const t = resolveToken(token)
  const res = await api.get("/commissions/me", {
    params,
    headers: { Authorization: `Bearer ${t}` },
  })
  return res.data
}

// ✅ remove endpoint inexistente (/commissions/summary)
// ✅ calcula resumo a partir da lista (não quebra nada)
export async function fetchMyCommissionSummary(
  token: string,
  params?: { status?: string; limit?: number; offset?: number }
) {
  const data = await fetchMyCommissions(token, params)

  const items = Array.isArray(data)
    ? data
    : (data?.items || data?.commissions || data?.rows || [])

  const by_status: Record<string, number> = {}
  let total = 0
  let paid_total = 0

  for (const c of items) {
    const amount = Number(c?.amount ?? 0)
    const a = Number.isFinite(amount) ? amount : 0
    total += a

    const st = String(c?.status ?? (c?.paid ? "paid" : "pending")).toLowerCase()
    by_status[st] = (by_status[st] || 0) + a

    if (c?.paid || st === "paid") paid_total += a
  }

  return { total, paid_total, by_status, count: items.length }
}
