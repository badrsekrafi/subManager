import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setAdmin(data.admin || data)
      setIsAuthenticated(true)
    } catch {
      setAdmin(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setAdmin(data.admin || data)
    setIsAuthenticated(true)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    setAdmin(null)
    setIsAuthenticated(false)
    window.location.href = '/login'
  }

  const updateProfile = async (profileData) => {
    const { data } = await api.put('/auth/profile', profileData)
    setAdmin(data.admin || data)
    return data
  }

  return (
    <AuthContext.Provider value={{ admin, loading, isAuthenticated, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
