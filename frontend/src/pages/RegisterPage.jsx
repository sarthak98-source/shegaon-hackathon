import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ShoppingBag, ArrowRight, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', role: params.get('role') || 'buyer' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()

  const strength = (pw) => {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }
  const pwStrength = strength(form.password)
  const strengthInfo = [null, { label:'Weak', color:'bg-red-500' }, { label:'Fair', color:'bg-yellow-500' }, { label:'Good', color:'bg-blue-500' }, { label:'Strong', color:'bg-green-500' }]

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const u = await register(form.name, form.email, form.password, form.role)
      const map = { buyer:'/buyer', seller:'/seller', admin:'/admin' }
      navigate(map[u.role] || '/buyer', { replace: true })
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed. Please try again.' })
    } finally { setLoading(false) }
  }

  const roles = [
    { id:'buyer',  label:'Buyer',  desc:'Shop & try products',  icon:'🛍️' },
    { id:'seller', label:'Seller', desc:'Sell & go live',       icon:'📦' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 p-12 text-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <ShoppingBag size={18}/>
          </div>
          <span className="font-display text-2xl font-bold">VivMart</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold mb-4 leading-tight">Join the live<br/>shopping revolution.</h2>
          <p className="text-gray-400 text-lg mb-10">Create your account in seconds and start exploring.</p>
          <div className="space-y-4">
            {[
              { title:'As a Buyer',  desc:'Try 1,200+ products in AR, chat with sellers live, order in seconds.' },
              { title:'As a Seller', desc:'List products, go live on camera, receive orders in real time.' },
            ].map(i => (
              <div key={i.title} className="flex gap-3">
                <CheckCircle size={20} className="text-brand-500 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="font-semibold text-sm">{i.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{i.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-sm">© 2025 VivMart</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <ShoppingBag size={14} className="text-white"/>
              </div>
              <span className="font-display text-xl font-bold text-gray-900">VivMart</span>
            </Link>
          </div>

          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-500 text-sm mb-8">Already have one? <Link to="/login" className="text-brand-600 font-semibold">Sign in</Link></p>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="label">I want to</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => (
                  <button key={r.id} type="button" onClick={() => setForm(p => ({...p, role:r.id}))}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${form.role === r.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} placeholder="Your full name" className={`input pl-10 ${errors.name?'border-red-400':''}`}/>
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} placeholder="you@example.com" className={`input pl-10 ${errors.email?'border-red-400':''}`}/>
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type={showPw?'text':'password'} value={form.password} onChange={e => setForm(p => ({...p, password:e.target.value}))} placeholder="Min. 6 characters" className={`input pl-10 pr-10 ${errors.password?'border-red-400':''}`}/>
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i<=pwStrength ? strengthInfo[pwStrength]?.color : 'bg-gray-200'}`}/>)}</div>
                  <p className="text-xs text-gray-500">{strengthInfo[pwStrength]?.label} password</p>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword:e.target.value}))} placeholder="Repeat password" className={`input pl-10 ${errors.confirmPassword?'border-red-400':form.confirmPassword&&form.password===form.confirmPassword?'border-green-400':''}`}/>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <>Create Account <ArrowRight size={16}/></>}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            By creating an account you agree to our <span className="text-brand-600 cursor-pointer">Terms</span> & <span className="text-brand-600 cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
