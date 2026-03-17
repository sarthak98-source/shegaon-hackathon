import React, { useState, useEffect, useRef } from 'react'
import { Video, VideoOff, Mic, MicOff, Send, Sparkles, ShoppingCart, X, MessageSquare, Users, Radio } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { products } from '../../data/products'
import { useCart } from '../../context/CartContext'
import { Link } from 'react-router-dom'

// ── Mock live sessions ────────────────────────────────────────────
const LIVE_SESSIONS = [
  { id: 'session_1', sellerName:'Raj Kumar', shopName:'FashionHouse', viewers:142, productIds:[1,7], thumbnail: products[0].image, title:'Summer Collection Launch 🔥' },
  { id: 'session_2', sellerName:'Priya Mehta', shopName:'GemCraft',    viewers:89,  productIds:[2,10], thumbnail: products[1].image, title:'Exclusive Jewelry Show ✨' },
  { id: 'session_3', sellerName:'Arun Patel',  shopName:'TechZone',    viewers:310, productIds:[6,9], thumbnail: products[5].image, title:'New iPhone 15 Unboxing 📱' },
]

// ── Agora SDK loader ──────────────────────────────────────────────
const loadAgora = () => new Promise((res, rej) => {
  if (window.AgoraRTC) { res(window.AgoraRTC); return }
  const s = document.createElement('script')
  s.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.20.0.js'
  s.onload  = () => res(window.AgoraRTC)
  s.onerror = () => rej(new Error('Failed to load Agora SDK'))
  document.head.appendChild(s)
})

export default function BuyerLiveSession() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const [selectedSession, setSelectedSession] = useState(null)
  const [joined, setJoined]     = useState(false)
  const [messages, setMessages] = useState([
    { id:1, user:'Raj Kumar', role:'seller', text:'Welcome everyone! 👋 Today we have amazing deals on our summer collection.', time:'2m ago' },
    { id:2, user:'Sneha',     role:'buyer',  text:'Can you show the blazer in blue?', time:'1m ago' },
    { id:3, user:'Raj Kumar', role:'seller', text:'Absolutely! Here it is 👌', time:'1m ago' },
    { id:4, user:'Rahul',     role:'buyer',  text:'What sizes are available?', time:'30s ago' },
  ])
  const [newMsg, setNewMsg]     = useState('')
  const [arProduct, setArProduct] = useState(null)
  const [micOn, setMicOn]       = useState(true)
  const [camOn, setCamOn]       = useState(false)
  const [agoraClient, setAgoraClient] = useState(null)
  const [joinError, setJoinError]     = useState('')
  const videoRef   = useRef(null)
  const chatEndRef  = useRef(null)
  const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'YOUR_AGORA_APP_ID'

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  // Mock new messages coming in
  useEffect(() => {
    if (!joined) return
    const mockMessages = [
      { user:'Ananya', role:'buyer', text:'Can I try this in AR?' },
      { user:'Deepak', role:'buyer', text:'Price is really good! 🎉' },
      { user:selectedSession?.sellerName, role:'seller', text:'Yes! Click the AR button next to any product to try it on!' },
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < mockMessages.length) {
        setMessages(prev => [...prev, { id: Date.now()+i, ...mockMessages[i], time:'just now' }])
        i++
      } else clearInterval(interval)
    }, 4000)
    return () => clearInterval(interval)
  }, [joined])

  const joinSession = async (session) => {
    setSelectedSession(session)
    setJoinError('')
    try {
      const AgoraRTC = await loadAgora()
      const client = AgoraRTC.createClient({ mode:'live', codec:'vp8' })
      client.setClientRole('audience')
      // In production: fetch a real token from your backend
      // await client.join(AGORA_APP_ID, session.id, null, user.id)
      setAgoraClient(client)
    } catch (e) {
      // Agora not available in demo — proceed with simulated session
      console.log('Agora unavailable, using demo mode:', e.message)
    }
    setJoined(true)
    setMessages([
      { id:1, user:session.sellerName, role:'seller', text:`Welcome to ${session.title}! Great to have you here 🎉`, time:'just now' },
    ])
  }

  const leaveSession = async () => {
    try { await agoraClient?.leave() } catch {}
    setAgoraClient(null)
    setJoined(false)
    setSelectedSession(null)
    setArProduct(null)
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    setMessages(prev => [...prev, { id: Date.now(), user: user?.name || 'You', role:'buyer', text: newMsg.trim(), time:'just now' }])
    setNewMsg('')
    // In production: emit via socket.io
  }

  const sessionProducts = selectedSession ? products.filter(p => selectedSession.productIds.includes(p.id)) : []

  // ── Session grid ─────────────────────────────────────────────
  if (!joined) return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Live Sessions</h1>
        <p className="text-gray-500 text-sm mt-1">Join a live session to watch sellers demo products in real time</p>
      </div>

      {/* Live sessions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LIVE_SESSIONS.map(session => (
          <div key={session.id} className="card-hover overflow-hidden" onClick={() => joinSession(session)}>
            <div className="relative aspect-video overflow-hidden bg-gray-900">
              <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover opacity-80"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/>
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <Radio size={10}/> LIVE
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                <Users size={10}/> {session.viewers}
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white font-semibold text-sm leading-tight">{session.title}</p>
                <p className="text-gray-300 text-xs mt-1">{session.sellerName} · {session.shopName}</p>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">{session.sellerName.charAt(0)}</div>
                <p className="text-sm font-medium text-gray-700">{session.shopName}</p>
              </div>
              <button className="btn-primary text-xs py-1.5 px-3"><Video size={12}/> Join</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 bg-brand-50 border-brand-200">
        <p className="text-sm font-semibold text-brand-800 mb-1">📅 Upcoming Sessions</p>
        <p className="text-sm text-brand-600">New sessions every day at 6 PM and 9 PM IST. Turn on notifications to get reminded.</p>
      </div>
    </div>
  )

  // ── Active session ────────────────────────────────────────────
  return (
    <div className="max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">

        {/* Video + AR panel */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Video feed */}
          <div className="relative video-tile flex-1">
            {/* Simulated seller video — in production this is Agora remote stream */}
            <img src={selectedSession.thumbnail} alt="Live" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>

            {/* Live badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Radio size={10}/> LIVE
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              <Users size={11}/> {selectedSession.viewers} watching
            </div>

            {/* Seller info */}
            <div className="absolute bottom-3 left-3">
              <p className="text-white font-bold">{selectedSession.sellerName}</p>
              <p className="text-gray-300 text-xs">{selectedSession.shopName} · {selectedSession.title}</p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button onClick={() => setMicOn(!micOn)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${micOn?'bg-white/20 hover:bg-white/30':'bg-red-500'}`}>
                {micOn ? <Mic size={15} className="text-white"/> : <MicOff size={15} className="text-white"/>}
              </button>
              <button onClick={leaveSession} className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                <X size={15} className="text-white"/>
              </button>
            </div>

            {/* AR overlay when active */}
            {arProduct && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="bg-white rounded-2xl p-4 w-full max-w-md mx-4 max-h-[80%] overflow-auto">
                  <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Sparkles size={16} className="text-brand-500"/> AR Try-On</p>
                  <img src={arProduct.image} alt={arProduct.name} className="w-full aspect-square object-cover rounded-xl mb-3"/>
                  <p className="font-semibold text-gray-900 mb-1">{arProduct.name}</p>
                  <p className="text-brand-600 font-bold mb-3">₹{arProduct.price.toLocaleString('en-IN')}</p>
                  <div className="flex gap-2">
                    <Link to={`/buyer/ar/${arProduct.id}`} className="btn-primary flex-1 justify-center text-sm">Full AR Try-On</Link>
                    <button onClick={() => setArProduct(null)} className="btn-secondary px-4">Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products in session */}
          <div className="card p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Products in this session</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {sessionProducts.map(p => (
                <div key={p.id} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 hover:border-brand-300 transition-colors">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover"/>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">{p.name}</p>
                    <p className="text-xs text-brand-600 font-bold">₹{p.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setArProduct(p)} className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center hover:bg-brand-200 transition-colors" title="AR Try-On">
                      <Sparkles size={11} className="text-brand-600"/>
                    </button>
                    <button onClick={() => addItem(p)} className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors" title="Add to cart">
                      <ShoppingCart size={11} className="text-green-600"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-500"/>
            <p className="font-semibold text-gray-800 text-sm">Live Chat</p>
            <span className="ml-auto badge-green">{messages.length} msgs</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.user === user?.name ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${msg.role==='seller'?'bg-brand-500':'bg-gray-400'}`}>
                  {msg.user.charAt(0)}
                </div>
                <div className={`max-w-[75%] ${msg.user===user?.name?'items-end':''} flex flex-col`}>
                  <p className="text-xs text-gray-500 mb-0.5">{msg.user} {msg.role==='seller'&&<span className="badge-orange ml-1 text-xs py-0 px-1">Seller</span>}</p>
                  <div className={`rounded-xl px-3 py-2 text-sm ${msg.user===user?.name?'bg-brand-500 text-white':'bg-gray-100 text-gray-800'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Ask the seller..." className="input text-sm flex-1"/>
            <button type="submit" className="btn-primary px-3 py-2"><Send size={15}/></button>
          </form>
        </div>
      </div>
    </div>
  )
}
