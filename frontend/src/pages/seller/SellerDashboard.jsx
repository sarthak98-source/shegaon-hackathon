import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, TrendingUp, Video, Plus, Edit2, Trash2, Eye, Send, Mic, MicOff, VideoOff, Users, Radio, X, Check, Image } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { products as allProducts } from '../../data/products'

// ─── Seller Dashboard ─────────────────────────────────────────────
export function SellerDashboard() {
  const { user } = useAuth()
  const stats = [
    { label:'Total Products', value:'12', icon: Package,     color:'bg-blue-50 text-blue-600' },
    { label:'Pending Orders', value:'5',  icon: ShoppingBag, color:'bg-orange-50 text-orange-600' },
    { label:'Revenue (Month)', value:'₹1.2L', icon: TrendingUp, color:'bg-green-50 text-green-600' },
    { label:'Live Sessions',  value:'8',  icon: Video,       color:'bg-red-50 text-red-600' },
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
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon size={18}/></div>
            <p className="font-display text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-3">Recent Orders</p>
          {[{id:'ORD-045',product:'Luxe Silk Blazer',buyer:'Rahul M.',amount:'₹12,999',status:'Processing'},{id:'ORD-046',product:'Diamond Ring',buyer:'Priya S.',amount:'₹45,999',status:'Shipped'}].map(o=>(
            <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div><p className="text-sm font-medium text-gray-800">{o.product}</p><p className="text-xs text-gray-500">{o.id} · {o.buyer}</p></div>
              <div className="text-right"><p className="text-sm font-bold text-gray-900">{o.amount}</p><span className="badge-orange text-xs">{o.status}</span></div>
            </div>
          ))}
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
  const [myProducts, setMyProducts] = useState(allProducts.slice(0,6))
  const [showAdd, setShowAdd]       = useState(false)
  const [form, setForm]             = useState({ name:'', category:'clothing', price:'', description:'' })

  const handleAdd = e => {
    e.preventDefault()
    const newP = { id: Date.now(), ...form, price: parseInt(form.price)||0, image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=500', rating:0, reviews:0, arMode:'body', badge:'New', colors:['#1a1a1a'], sizes:['M'], featured:false, seller:'My Shop', sellerId:2 }
    setMyProducts(prev => [newP, ...prev])
    setForm({ name:'', category:'clothing', price:'', description:'' })
    setShowAdd(false)
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
            <div><label className="label">Description</label><input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="input" placeholder="Short description"/></div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary"><Check size={15}/> Save Product</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Product','Category','Price','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {myProducts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
                    <div><p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{p.name}</p><p className="text-xs text-gray-400">{p.badge}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="badge-gray capitalize">{p.category}</span></td>
                <td className="px-4 py-3 font-semibold text-sm text-gray-900">₹{p.price.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3"><span className="badge-green">Active</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-brand-600"><Edit2 size={14}/></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500" onClick={() => setMyProducts(prev=>prev.filter(x=>x.id!==p.id))}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Seller Live ──────────────────────────────────────────────────
export function SellerLive() {
  const { user } = useAuth()
  const [isLive, setIsLive]     = useState(false)
  const [micOn, setMicOn]       = useState(true)
  const [camOn, setCamOn]       = useState(true)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg]     = useState('')
  const [viewers, setViewers]   = useState(0)
  const [streamTitle, setStreamTitle] = useState('')
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const startLive = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
    } catch { console.log('Camera unavailable, using demo mode') }
    setIsLive(true)
    setViewers(0)
    setMessages([{ id:1, user:'System', role:'system', text:`${user?.name} started a live session: "${streamTitle||'Live Shopping'}"`, time:'just now' }])
    // Simulate viewers joining
    const vInt = setInterval(() => setViewers(v => v + Math.floor(Math.random()*3+1)), 3000)
    // Simulate buyer messages
    const buyerMsgs = ['Can you show sizes?','What material is this?','Can I try AR?','Is it available in red?','Price seems good!']
    let i=0
    const mInt = setInterval(() => {
      if (i < buyerMsgs.length) {
        const names = ['Rahul','Priya','Ananya','Deepak','Sneha']
        setMessages(prev => [...prev, { id: Date.now(), user: names[i%names.length], role:'buyer', text: buyerMsgs[i], time:'just now' }])
        i++
      }
    }, 5000)
    return () => { clearInterval(vInt); clearInterval(mInt) }
  }

  const stopLive = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsLive(false); setViewers(0)
  }

  const sendMsg = e => {
    e.preventDefault()
    if (!newMsg.trim()) return
    setMessages(prev => [...prev, { id:Date.now(), user:user?.name, role:'seller', text:newMsg.trim(), time:'just now' }])
    setNewMsg('')
  }

  const toggleMic = () => {
    setMicOn(!micOn)
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn })
  }

  const toggleCam = () => {
    setCamOn(!camOn)
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn })
  }

  if (!isLive) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="page-title">Go Live</h1>
      <div className="card p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5"><Radio size={36} className="text-red-500"/></div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Start Live Session</h2>
        <p className="text-gray-500 text-sm mb-6">Go live to show products, answer questions and help buyers try items in AR</p>
        <div className="mb-6 text-left">
          <label className="label">Session Title</label>
          <input value={streamTitle} onChange={e=>setStreamTitle(e.target.value)} placeholder="e.g. Summer Collection Launch 🔥" className="input"/>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['Camera access','Mic access','Good lighting'].map(t => <div key={t} className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500 font-medium">{t}</div>)}
        </div>
        <button onClick={startLive} className="btn-primary px-8 py-3 text-base"><Radio size={18}/> Start Live Session</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
        {/* Stream */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="relative video-tile flex-1">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline/>
            {!streamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white"><Video size={48} className="mx-auto mb-3 opacity-50"/><p className="text-sm opacity-70">Camera preview</p></div>
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Radio size={10}/> LIVE
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              <Users size={11}/> {viewers} viewers
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
              <button onClick={toggleMic} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${micOn?'bg-white/20 hover:bg-white/30':'bg-red-500'}`}>
                {micOn?<Mic size={16} className="text-white"/>:<MicOff size={16} className="text-white"/>}
              </button>
              <button onClick={toggleCam} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${camOn?'bg-white/20 hover:bg-white/30':'bg-red-500'}`}>
                {camOn?<Video size={16} className="text-white"/>:<VideoOff size={16} className="text-white"/>}
              </button>
              <button onClick={stopLive} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                <X size={16} className="text-white"/>
              </button>
            </div>
          </div>

          {/* Show products */}
          <div className="card p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Showcase Products</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allProducts.slice(0,6).map(p => (
                <div key={p.id} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 hover:border-brand-300 cursor-pointer transition-colors">
                  <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover"/>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{p.name}</p>
                    <p className="text-xs text-brand-600 font-bold">₹{p.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
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
                      <p className="text-xs text-gray-500 mb-0.5">{msg.user} {msg.role==='seller'&&<span className="badge-orange ml-1 text-xs py-0 px-1">You</span>}</p>
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

// ─── Seller Orders ─────────────────────────────────────────────────
export function SellerOrders() {
  const orders = [
    { id:'ORD-041', buyer:'Rahul Mehta', product:'Luxe Silk Blazer', amount:12999, date:'Mar 15', status:'Processing' },
    { id:'ORD-042', buyer:'Priya Singh', product:'Diamond Halo Ring', amount:45999, date:'Mar 14', status:'Shipped' },
    { id:'ORD-043', buyer:'Ananya K.', product:'Maxi Dress', amount:7499, date:'Mar 13', status:'Delivered' },
  ]
  const statusColors = { Processing:'badge-orange', Shipped:'badge-blue', Delivered:'badge-green', Cancelled:'badge-red' }
  const statusNext   = { Processing:'Mark Shipped', Shipped:'Mark Delivered' }

  return (
    <div className="max-w-5xl space-y-5">
      <h1 className="page-title">Orders</h1>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Order','Buyer','Product','Amount','Date','Status','Action'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.id}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{o.buyer}</td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-[120px] truncate">{o.product}</td>
                <td className="px-4 py-3 font-bold text-sm text-gray-900">₹{o.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{o.date}</td>
                <td className="px-4 py-3"><span className={statusColors[o.status]||'badge-gray'}>{o.status}</span></td>
                <td className="px-4 py-3">
                  {statusNext[o.status] && <button className="btn-secondary text-xs py-1.5 px-3">{statusNext[o.status]}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SellerDashboard
