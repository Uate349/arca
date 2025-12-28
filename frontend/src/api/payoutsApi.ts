import api from "./apiClient"

export async function fetchMyPayouts(
  token: string,
  params?: { limit?: number; offset?: number }
) {
  const res = await api.get("/payouts/me", {
    params,
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}