import api from './apiClient'

export async function fetchMyCommissions(token: string) {
  const res = await api.get('/commissions/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
