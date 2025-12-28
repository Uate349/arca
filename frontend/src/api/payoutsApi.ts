import api from "./apiClient"

// -----------------------------
// 🔹 CONSULTOR / USER
// -----------------------------
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

// -----------------------------
// 🔹 ADMIN
// -----------------------------

// listar payouts (admin)
export async function adminFetchPayouts(token: string) {
  const res = await api.get("/admin/payouts", {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

// gerar payouts por período (admin)
export async function adminGeneratePayouts(
  token: string,
  days: number = 30
) {
  const res = await api.post(
    "/admin/payouts/generate",
    { days },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  return res.data
}

// marcar payout como pago (admin)
export async function adminMarkPayoutPaid(
  token: string,
  payoutId: string,
  method: string = "mpesa",
  reference?: string
) {
  const res = await api.post(
    `/admin/payouts/${payoutId}/mark-paid`,
    { method, reference },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  return res.data
}