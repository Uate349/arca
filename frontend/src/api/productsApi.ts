import api from './apiClient'

export async function fetchProducts() {
  const res = await api.get('/products/')
  return res.data
}
