import api from "./apiClient"

export async function fetchMyCommissions(
  token: string,
  params?: { status?: string; limit?: number; offset?: number }
) {
  const res = await api.get("/commissions/me", {
    params,
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function fetchMyCommissionSummary(token: string) {
  const res = await api.get("/commissions/summary", {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}