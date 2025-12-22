import api from './apiClient'

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export async function register(payload: {
  name: string
  email: string
  phone: string
  password: string
}) {
  const res = await api.post('/auth/register', {
    ...payload,
    role: 'customer',
  })
  return res.data
}

export async function getMe(token: string) {
  const res = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
