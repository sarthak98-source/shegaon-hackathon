import React, { useState, useEffect, useRef } from 'react'
import { Video, Mic, MicOff, Send, Sparkles, ShoppingCart, X, MessageSquare, Users, Radio } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../../api'

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'a38021cddae9424ba6d8bd8de75bf048'
const SOCKET_URL   = import.meta.env.VITE_SOCKET_URL   || 'http://localhost:5000'

const loadAgora = () => new Promise((resolve, reject) => {
  if (window.AgoraRTC) { resolve(window.AgoraRTC); return }
  const s = document.createElement('script')
  s.src     = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.20.0.js'
  s.onload  = () => resolve(window.AgoraRTC)
  s.onerror = () => reject(new Error('Failed to load Agora SDK'))
  document.head.appendChild(s)
})

export default function BuyerLiveSession() {
  const { user }    = useAuth()
  const { addItem } = useCart()

  const [sessions,        setSessions]        = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [joined,          setJoined]          = useState(false)
  const [messages,        setMessages]        = useState([])
  const [newMsg,          setNewMsg]          = useState('')
  const [arProduct,       setArProduct]       = useState(null)
  const [viewers,         setViewers]         = useState(0)
  const [loadingJoin,     setLoadingJoin]     = useState(false)

  // ── Agora renders remote video into a div ──
  const remoteVideoRef = useRef(null)
  const socketRef      = useRef(null)
  const agoraClient    = useRef(null)
  const chatEndRef     = useRef(null)

  useEffect(() => {
    api.get('/live/sessions')
      .then(({ data }) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Join session ──────────────────────────────────────────────
  const joinSession = async (session) => {
    setLoadingJoin(true)
    setSelectedSession(session)
    try {
      // 1. Connect Socket.io
      const socket = io(SOCKET_URL, { transports: ['websocket'] })
      socketRef.current = socket

      socket.emit('join_session', {
        sessionId: session.id,
        userId:    user?.id,
        userName:  user?.name || 'Guest',
        role:      'buyer',
      })

      // Receive chat history on join
      socket.on('message_history', (msgs) => {
        setMessages(msgs.map(m => ({
          id:   m.id,
          user: m.userName,
          role: m.role,
          text: m.text,
        })))
      })

      // Receive new messages in real time
      socket.on('new_message', (msg) => {
        setMessages(prev => [...prev, {
          id:   msg.id || Date.now(),
          user: msg.userName,
          role: msg.role,
          text: msg.text,
        }])
      })

      socket.on('viewer_count', (count) => setViewers(count))

      // Seller pushed AR to viewers
      socket.on('ar_triggered', ({ productId }) => {
        api.get(`/products/${productId}`)
          .then(({ data }) => { if (data.product) setArProduct(data.product) })
          .catch(() => {})
      })

      // 2. Join Agora as audience
      try {
        const AgoraRTC = await loadAgora()
        const client   = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        agoraClient.current = client
        await client.setClientRole('audience')
        await client.join(AGORA_APP_ID, String(session.id), null, user?.id || Math.floor(Math.random() * 99999))

        // When seller publishes video/audio — play it
        client.on('user-published', async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType)
          if (mediaType === 'video' && remoteVideoRef.current) {
            // Clear container and play
            remoteVideoRef.current.innerHTML = ''
            remoteUser.videoTrack?.play(remoteVideoRef.current)
          }
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play()
          }
        })

        client.on('user-unpublished', (remoteUser, mediaType) => {
          if (mediaType === 'video' && remoteVideoRef.current) {
            remoteVideoRef.current.innerHTML = ''
          }
        })

      } catch (agoraErr) {
        console.warn('Agora join failed:', agoraErr.message)
      }

      api.put(`/live/${session.id}/viewers`, { action: 'join' }).catch(() => {})
      setJoined(true)

    } catch (err) {
      console.error('Join error:', err)
    } finally {
      setLoadingJoin(false)
    }
  }

  // ── Leave session ─────────────────────────────────────────────
  const leaveSession = async () => {
    socketRef.current?.emit('leave_session', {
      sessionId: selectedSession?.id,
      userName:  user?.name,
    })
    socketRef.current?.disconnect()
    socketRef.current = null

    try { await agoraClient.current?.leave() } catch {}
    agoraClient.current = null
    if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = ''

    api.put(`/live/${selectedSession?.id}/viewers`, { action: 'leave' }).catch(() => {})

    setJoined(false)
    setSelectedSession(null)
    setMessages([])
    setArProduct(null)
    setViewers(0)
  }

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !socketRef.current) return
    socketRef.current.emit('send_message', {
      sessionId: selectedSession?.id,
      userId:    user?.id,
      userName:  user?.name || 'Guest',
      role:      'buyer',
      text:      newMsg.trim(),
    })
    setNewMsg('')
  }

  // ── Session list ──────────────────────────────────────────────
  if (!joined) return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Live Sessions</h1>
        <p className="text-gray-500 text-sm mt-1">Join a live session to watch sellers demo products in real time</p>
      </div>

      {sessions.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-gray-600 font-semibold">No live sessions right now</p>
          <p className="text-gray-400 text-sm mt-1">Wait for a seller to go live</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <div key={session.id} className="card-hover overflow-hidden cursor-pointer" onClick={() => !loadingJoin && joinSession(session)}>
              <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Radio size={32} className="mx-auto mb-2 text-red-400"/>
                  <p className="font-semibold text-sm px-4">{session.title}</p>
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <Radio size={10}/> LIVE
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  <Users size={10}/> {session.viewers}
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                    {session.seller_name?.charAt(0) || 'S'}
                  </div>
                  <p className="text-sm font-medium text-gray-700">{session.seller_name}</p>
                </div>
                <button disabled={loadingJoin} className="btn-primary text-xs py-1.5 px-3">
                  <Video size={12}/> {loadingJoin ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Active session ────────────────────────────────────────────
  return (
    <div className="max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">

        {/* Video panel */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex-1 min-h-[300px]">

            {/* ── Remote video container (Agora plays into this div) ── */}
            <div
              ref={remoteVideoRef}
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            />

            {/* Placeholder shown while waiting */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white/30">
                <Radio size={40} className="mx-auto mb-2"/>
                <p className="text-sm">Waiting for seller video...</p>
              </div>
            </div>

            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Radio size={10}/> LIVE
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              <Users size={11}/> {viewers} watching
            </div>
            <div className="absolute bottom-3 left-3">
              <p className="text-white font-bold">{selectedSession?.seller_name}</p>
              <p className="text-gray-300 text-xs">{selectedSession?.title}</p>
            </div>
            <button onClick={leaveSession} className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center">
              <X size={15} className="text-white"/>
            </button>

            {/* AR overlay */}
            {arProduct && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                <div className="bg-white rounded-2xl p-4 w-full max-w-sm mx-4">
                  <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-brand-500"/> AR Try-On
                  </p>
                  <img src={arProduct.image_url} alt={arProduct.name} className="w-full aspect-square object-cover rounded-xl mb-3"/>
                  <p className="font-semibold text-gray-900 mb-1">{arProduct.name}</p>
                  <p className="text-brand-600 font-bold mb-3">₹{Number(arProduct.price).toLocaleString('en-IN')}</p>
                  <div className="flex gap-2">
                    <button onClick={() => addItem(arProduct)} className="btn-primary flex-1 justify-center text-sm">
                      <ShoppingCart size={14}/> Add to Cart
                    </button>
                    <Link to={`/buyer/ar/${arProduct.id}`} className="btn-secondary px-3 text-sm">AR</Link>
                    <button onClick={() => setArProduct(null)} className="btn-secondary px-3">✕</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-500"/>
            <p className="font-semibold text-gray-800 text-sm">Live Chat</p>
            <span className="ml-auto badge-green">{messages.length} msgs</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex gap-2 ${msg.user === user?.name ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${msg.role === 'seller' ? 'bg-brand-500' : 'bg-gray-400'}`}>
                  {msg.user?.charAt(0) || '?'}
                </div>
                <div className={`max-w-[75%] flex flex-col ${msg.user === user?.name ? 'items-end' : ''}`}>
                  <p className="text-xs text-gray-500 mb-0.5">
                    {msg.user}
                    {msg.role === 'seller' && <span className="badge-orange ml-1 text-xs py-0 px-1">Seller</span>}
                  </p>
                  <div className={`rounded-xl px-3 py-2 text-sm ${msg.user === user?.name ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Ask the seller..."
              className="input text-sm flex-1"
            />
            <button type="submit" className="btn-primary px-3 py-2"><Send size={15}/></button>
          </form>
        </div>

      </div>
    </div>
  )
}