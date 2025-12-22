import api from './apiClient'

export async function createOrder(token: string, payload: { items: { product_id: string; quantity: number }[]; points_to_use: number }) {
  const res = await api.post('/orders/', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function fetchMyOrders(token: string) {
  const res = await api.get('/orders/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
