import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { User } from '../types'

type AuthContextValue = { user: User | null; loading: boolean; login: (username: string, password: string) => Promise<User>; logout: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get<User>('/auth/me').then((response) => setUser(response.data)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (username, password) => {
      const response = await api.post<{ user: User }>('/auth/login', { username, password })
      setUser(response.data.user)
      return response.data.user
    },
    logout: async () => { await api.post('/auth/logout'); setUser(null) },
  }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
