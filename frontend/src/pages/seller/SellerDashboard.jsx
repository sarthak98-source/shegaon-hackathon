import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, TrendingUp, Video, Plus, Edit2, Trash2, Send, Mic, MicOff, VideoOff, Users, Radio, X, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

// ─── Seller Dashboard ─────────────────────────────────────────────
export function SellerDashboard() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState({ products:0, pendingOrders:0, revenue:'₹0', liveSessions:0 })
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/products?sellerId=${user?.id}&limit=1`),
      api.get('/orders'),
    ]).then(([prodRes, ordRes]) => {
      const allOrders = ordRes.data.orders || []
      const pending   = allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length
      const revenue   = allOrders.reduce((s, o) => s + Number(o.total || 0), 0)
      setStats({
        products:     prodRes.data.total || 0,
        pendingOrders: pending,
        revenue:      `₹${(revenue/100000).toFixed(1)}L`,
        liveSessions: 0,
      })
      setOrders(allOrders.slice(0,3))
    }).catch(console.error).finally(() => setLoading(false))
  }, [user])

  const statCards = [
    { label:'Total Products',  value: stats.products,      icon: Package,     color:'bg-blue-50 text-blue-600'   },
    { label:'Pending Orders',  value: stats.pendingOrders, icon: ShoppingBag, color:'bg-orange-50 text-orange-600' },
    { label:'Revenue (Month)', value: stats.revenue,       icon: TrendingUp,  color:'bg-green-50 text-green-600'  },
    { label:'Live Sessions',   value: stats.liveSessions,  icon: Video,       color:'bg-red-50 text-red-600'      },
  ]

  return (
    <div className="max-w-5xl space-y-6">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
        <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
        <h1 className="font-display text-2xl font-bold mb-1">{user?.name}</h1>
        <p className="text-gray-400 text-sm">Seller Dashboard · Ready to go live?</p>
        <Link to="/seller/live" className="btn-primary mt-4 inline-flex"><Video size={15}/> Start Live Session</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon size={18}/></div>
            <p className="font-display text-2xl font-bold text-gray-900">{loading ? '...' : s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-3">Recent Orders</p>
          {loading ? (
            <div className="space-y-3">{[...Array(2)].map((_,i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : orders.map(o => {
            const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
            return (
              <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{items[0]?.name}</p>
                  <p className="text-xs text-gray-500">ORD-{o.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{Number(o.total).toLocaleString('en-IN')}</p>
                  <span className="badge-orange text-xs">{o.status}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Link to="/seller/products" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-brand-50 hover:border-brand-200 border border-transparent transition-all">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center"><Plus size={15} className="text-brand-600"/></div>
              <span className="text-sm font-medium text-gray-700">Add New Product</span>
            </Link>
            <Link to="/seller/live" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 border border-transparent transition-all">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><Radio size={15} className="text-red-600"/></div>
              <span className="text-sm font-medium text-gray-700">Go Live Now</span>
            </Link>
            <Link to="/seller/orders" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 border border-transparent transition-all">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><ShoppingBag size={15} className="text-green-600"/></div>
              <span className="text-sm font-medium text-gray-700">View Orders</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Seller Products ──────────────────────────────────────────────
export function SellerProducts() {
  const { user } = useAuth()
  const [myProducts, setMyProducts] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({ name:'', category:'clothing', price:'', description:'', image_url:'' })

  useEffect(() => {
    api.get(`/products?sellerId=${user?.id}&limit=50`)
      .then(({ data }) => setMyProducts(data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.post('/products', {
        name:        form.name,
        category:    form.category,
        price:       parseInt(form.price) || 0,
        description: form.description,
        image_url:   form.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=500',
        ar_mode:     '3d',
      })
      if (data.success) {
        // Refresh the list
        const res = await api.get(`/products?sellerId=${user?.id}&limit=50`)
        setMyProducts(res.data.products || [])
        setForm({ name:'', category:'clothing', price:'', description:'', image_url:'' })
        setShowAdd(false)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setMyProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">My Products</h1><p className="text-gray-500 text-sm mt-1">{myProducts.length} listings</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus size={16}/> Add Product</button>
      </div>

      {showAdd && (
        <div className="card p-6 border-brand-200 bg-brand-50/30">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Product</h3>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Product Name</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="input" placeholder="e.g. Silk Blazer" required/></div>
            <div><label className="label">Category</label>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="input cursor-pointer">
                {['clothing','jewelry','glasses','hats','shoes','furniture','electronics','home-decor'].map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div><label className="label">Price (₹)</label><input type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} className="input" placeholder="0" required/></div>
            <div><label className="label">Image URL</label><input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))} className="input" placeholder="https://..."/></div>
            <div className="sm:col-span-2"><label className="label">Description</label><input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="input" placeholder="Short description"/></div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <><Check size={15}/> Save Product</>}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Product','Category','Price','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
                      <div><p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{p.name}</p><p className="text-xs text-gray-400">{p.badge}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-gray capitalize">{p.category}</span></td>
                  <td className="px-4 py-3 font-semibold text-sm text-gray-900">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><span className="badge-green">Active</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Seller Orders ────────────────────────────────────────────────
export function SellerOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const statusColors = { processing:'badge-orange', confirmed:'badge-orange', shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red', pending:'badge-orange' }
  const statusNext   = { pending:'confirmed', confirmed:'shipped', shipped:'delivered' }
  const statusLabels = { pending:'Confirm', confirmed:'Mark Shipped', shipped:'Mark Delivered' }

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status })
      setOrders(prev => prev.map(o => o.id === id ? {...o, status} : o))
    } catch {
      alert('Failed to update status')
    }
  }

  return (
    <div className="max-w-5xl space-y-5">
      <h1 className="page-title">Orders</h1>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No orders yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Order','Product','Amount','Date','Status','Action'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => {
                const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">ORD-{o.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[120px] truncate">{items[0]?.name}</td>
                    <td className="px-4 py-3 font-bold text-sm text-gray-900">₹{Number(o.total).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3"><span className={statusColors[o.status]||'badge-gray'}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      {statusNext[o.status] && (
                        <button onClick={() => updateStatus(o.id, statusNext[o.status])} className="btn-secondary text-xs py-1.5 px-3">
                          {statusLabels[o.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Seller Live (unchanged — Agora) ──────────────────────────────
export function SellerLive() {
  const { user } = useAuth()
  const [isLive,   setIsLive]   = useState(false)
  const [viewers,  setViewers]  = useState(0)
  const [messages, setMessages] = useState([])
  const [newMsg,   setNewMsg]   = useState('')
  const [micOn,    setMicOn]    = useState(true)
  const [camOn,    setCamOn]    = useState(false)
  const [session,  setSession]  = useState(null)
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const startLive = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream

      const { data } = await api.post('/live/start', { title: `${user?.name}'s Live Session`, productIds: [] })
      setSession(data)
      setIsLive(true)
      setCamOn(true)
      setMessages([{ id:1, user:'System', role:'system', text:'You are now live! 🎉' }])
    } catch (err) {
      alert('Camera access denied or backend error: ' + err.message)
    }
  }

  const stopLive = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (session?.sessionId) {
      await api.post(`/live/end/${session.sessionId}`).catch(console.error)
    }
    setIsLive(false)
    setCamOn(false)
    setSession(null)
  }

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(m => !m)
  }

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(c => !c)
  }

  const sendMsg = (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    setMessages(prev => [...prev, { id: Date.now(), user: user?.name, role:'seller', text: newMsg.trim() }])
    setNewMsg('')
  }

  if (!isLive) return (
    <div className="max-w-xl mx-auto">
      <div className="card p-10 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5"><Radio size={36} className="text-red-500"/></div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Go Live</h2>
        <p className="text-gray-500 text-sm mb-8">Start a live shopping session for your buyers</p>
        <button onClick={startLive} className="btn-primary px-8 py-3 text-base">
          <Video size={18}/> Start Live Session
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="relative video-tile flex-1 bg-gray-900 rounded-2xl overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline/>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Radio size={10}/> LIVE
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              <Users size={11}/> {viewers} viewers
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
              <button onClick={toggleMic} className={`w-10 h-10 rounded-full flex items-center justify-center ${micOn?'bg-white/20':'bg-red-500'}`}>
                {micOn?<Mic size={16} className="text-white"/>:<MicOff size={16} className="text-white"/>}
              </button>
              <button onClick={toggleCam} className={`w-10 h-10 rounded-full flex items-center justify-center ${camOn?'bg-white/20':'bg-red-500'}`}>
                {camOn?<Video size={16} className="text-white"/>:<VideoOff size={16} className="text-white"/>}
              </button>
              <button onClick={stopLive} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center">
                <X size={16} className="text-white"/>
              </button>
            </div>
          </div>
        </div>
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-800">Live Chat</p>
            <span className="badge-red">LIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role==='system'?'justify-center':''}`}>
                {msg.role==='system' ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">{msg.text}</p>
                ) : (
                  <>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${msg.role==='seller'?'bg-brand-500':'bg-gray-400'}`}>{msg.user.charAt(0)}</div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">{msg.user}</p>
                      <div className={`rounded-xl px-3 py-1.5 text-sm ${msg.role==='seller'?'bg-brand-500 text-white':'bg-gray-100 text-gray-800'}`}>{msg.text}</div>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={sendMsg} className="p-3 border-t border-gray-100 flex gap-2">
            <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Reply to buyers..." className="input text-sm flex-1"/>
            <button type="submit" className="btn-primary px-3 py-2"><Send size={14}/></button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard