import api from './apiClient'

export async function fetchMyPayouts(token: string) {
  const res = await api.get('/payouts/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
