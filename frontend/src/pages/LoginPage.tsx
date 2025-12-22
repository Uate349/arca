import { FormEvent, useState } from 'react'
import { login, getMe } from '../api/authApi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const tokenRes = await login(email, password)
      setToken(tokenRes.access_token)
      const me = await getMe(tokenRes.access_token)
      setUser(me)
      navigate('/')
    } catch (err: any) {
      setError('Falha ao entrar')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Entrar</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="text-xs text-red-400">{error}</div>}
        <button
          type="submit"
          className="mt-2 px-3 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
