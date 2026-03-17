import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(localStorage.getItem('vm_token') || null)
  const [loading, setLoading] = useState(true)

  // Set auth header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const stored = localStorage.getItem('vm_user')
      if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
    setLoading(false)
  }, [token])

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { user: u, token: t } = res.data
    setUser(u); setToken(t)
    localStorage.setItem('vm_token', t)
    localStorage.setItem('vm_user', JSON.stringify(u))
    return u
  }

  const register = async (name, email, password, role = 'buyer') => {
    const res = await axios.post('/api/auth/register', { name, email, password, role })
    const { user: u, token: t } = res.data
    setUser(u); setToken(t)
    localStorage.setItem('vm_token', t)
    localStorage.setItem('vm_user', JSON.stringify(u))
    return u
  }

  const logout = () => {
    setUser(null); setToken(null)
    localStorage.removeItem('vm_token')
    localStorage.removeItem('vm_user')
    delete axios.defaults.headers.common['Authorization']
  }

  // Demo login — works without backend
  const demoLogin = (role) => {
    const demos = {
      buyer:  { id: 1, name: 'Demo Buyer',      email: 'buyer@demo.com',  role: 'buyer'  },
      seller: { id: 2, name: 'Demo Seller',      email: 'seller@demo.com', role: 'seller' },
      admin:  { id: 3, name: 'Demo Admin',        email: 'admin@demo.com',  role: 'admin'  },
    }
    const u = demos[role]
    const t = 'demo_token_' + role + '_' + Date.now()
    setUser(u); setToken(t)
    localStorage.setItem('vm_token', t)
    localStorage.setItem('vm_user', JSON.stringify(u))
    return u
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, demoLogin, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
