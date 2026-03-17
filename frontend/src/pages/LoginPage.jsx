import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShoppingBag, ArrowRight, Mail, Lock, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form,   setForm]   = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,  setError]  = useState('')
  const { login, demoLogin } = useAuth()
  const navigate = useNavigate()

  const redirectByRole = (role) => {
    const map = { buyer: '/buyer', seller: '/seller', admin: '/admin' }
    navigate(map[role] || '/buyer', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill all fields'); return }
    setLoading(true)
    setError('')
    try {
      const u = await login(form.email, form.password)
      redirectByRole(u.role)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  // demoLogin is SYNC — returns user directly
  const handleDemo = (role) => {
    const u = demoLogin(role)
    redirectByRole(u.role)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-500 p-12 text-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <span className="font-display text-2xl font-bold">VivMart</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold mb-4 leading-tight">
            Your live shopping<br />experience awaits.
          </h2>
          <p className="text-orange-100 text-lg mb-8">
            Try products in AR, chat with sellers live, and buy with confidence.
          </p>
          <div className="space-y-3">
            {['Real-time AR try-on', 'Live seller sessions via video', 'Secure checkout & tracking'].map(f => (
              <div key={f} className="flex items-center gap-3 text-orange-50">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-orange-200 text-sm">© 2025 VivMart</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <ShoppingBag size={14} className="text-white" />
              </div>
              <span className="font-display text-xl font-bold text-gray-900">VivMart</span>
            </Link>
          </div>

          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <>Sign In <ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Demo login */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative text-center">
                <span className="bg-gray-50 px-3 text-xs text-gray-500 font-medium">Quick Demo Login</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['buyer', 'seller', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => handleDemo(r)}
                  className="flex flex-col items-center gap-1.5 p-3 border border-gray-200 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all text-xs font-semibold text-gray-600 hover:text-brand-700 capitalize"
                >
                  <Zap size={14} className="text-brand-500" />
                  {r}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}