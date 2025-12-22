import { useState } from 'react'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('arca_token'))
  const [user, setUser] = useState<any | null>(null)

  function saveToken(t: string) {
    setToken(t)
    localStorage.setItem('arca_token', t)
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('arca_token')
  }

  return { token, setToken: saveToken, user, setUser, logout }
}
