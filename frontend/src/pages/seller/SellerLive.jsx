import React, { useState, useRef, useEffect } from 'react'
import { Video, VideoOff, Mic, MicOff, Send, Users, Radio, X, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
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

export default function SellerLive() {
  const { user } = useAuth()

  const [isLive,     setIsLive]     = useState(false)
  const [viewers,    setViewers]    = useState(0)
  const [messages,   setMessages]   = useState([])
  const [newMsg,     setNewMsg]     = useState('')
  const [micOn,      setMicOn]      = useState(true)
  const [camOn,      setCamOn]      = useState(true)
  const [sessionId,  setSessionId]  = useState(null)
  const [starting,   setStarting]   = useState(false)
  const [error,      setError]      = useState('')
  const [myProducts, setMyProducts] = useState([])

  // ── IMPORTANT: Agora renders into a <div>, NOT a <video> tag ──
  const videoContainerRef = useRef(null)
  const socketRef         = useRef(null)
  const agoraClient       = useRef(null)
  const localVideoTrack   = useRef(null)
  const localAudioTrack   = useRef(null)
  const chatEndRef        = useRef(null)
  const fallbackStreamRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (user?.id) {
      api.get(`/products?sellerId=${user.id}&limit=10`)
        .then(({ data }) => setMyProducts(data.products || []))
        .catch(() => {})
    }
  }, [user])

  // ── Start Live ────────────────────────────────────────────────
  const startLive = async () => {
    setStarting(true)
    setError('')
    try {
      // 1. Create session in backend
      const { data } = await api.post('/live/start', {
        title:      `${user?.name}'s Live Session`,
        productIds: myProducts.map(p => p.id),
      })
      const sid = data.sessionId
      setSessionId(sid)

      // 2. Connect Socket.io
      const socket = io(SOCKET_URL, { transports: ['websocket'] })
      socketRef.current = socket

      socket.emit('join_session', {
        sessionId: sid,
        userId:    user?.id,
        userName:  user?.name,
        role:      'seller',
      })

      // ── Receive ALL messages (including from buyers) ──
      socket.on('new_message', (msg) => {
        setMessages(prev => [...prev, {
          id:   msg.id || Date.now(),
          user: msg.userName,
          role: msg.role,
          text: msg.text,
        }])
      })

      socket.on('viewer_count', (count) => setViewers(count))

      socket.on('user_joined', ({ userName }) => {
        setMessages(prev => [...prev, {
          id:   Date.now(),
          user: 'System',
          role: 'system',
          text: `${userName} joined 👋`,
        }])
      })

      // 3. Start Agora as host
      try {
        const AgoraRTC = await loadAgora()
        const client   = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        agoraClient.current = client
        await client.setClientRole('host')
        await client.join(AGORA_APP_ID, String(sid), null, user?.id || 1)

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localAudioTrack.current = audioTrack
        localVideoTrack.current = videoTrack
        await client.publish([audioTrack, videoTrack])

        // ── Play local video in the container div ──
        if (videoContainerRef.current) {
          videoTrack.play(videoContainerRef.current)
        }

      } catch (agoraErr) {
        console.warn('Agora failed, using browser fallback:', agoraErr.message)
        // Fallback: getUserMedia directly into a video element
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          fallbackStreamRef.current = stream
          // Create a video element manually inside the container
          if (videoContainerRef.current) {
            videoContainerRef.current.innerHTML = ''
            const vid = document.createElement('video')
            vid.srcObject = stream
            vid.autoplay  = true
            vid.muted     = true
            vid.playsInline = true
            vid.style.cssText = 'width:100%;height:100%;object-fit:cover;'
            videoContainerRef.current.appendChild(vid)
            vid.play()
          }
        } catch {
          setError('Camera/mic access denied. Please allow camera access and try again.')
        }
      }

      setIsLive(true)
      setMessages([{
        id:   Date.now(),
        user: 'System',
        role: 'system',
        text: '🎉 You are now live!',
      }])

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start live session')
    } finally {
      setStarting(false)
    }
  }

  // ── Stop Live ─────────────────────────────────────────────────
  const stopLive = async () => {
    localVideoTrack.current?.stop()
    localVideoTrack.current?.close()
    localAudioTrack.current?.stop()
    localAudioTrack.current?.close()
    try { await agoraClient.current?.leave() } catch {}
    agoraClient.current = null

    // Stop fallback stream
    fallbackStreamRef.current?.getTracks().forEach(t => t.stop())
    fallbackStreamRef.current = null
    if (videoContainerRef.current) videoContainerRef.current.innerHTML = ''

    if (sessionId) await api.post(`/live/end/${sessionId}`).catch(() => {})

    socketRef.current?.emit('leave_session', { sessionId, userName: user?.name })
    socketRef.current?.disconnect()
    socketRef.current = null

    setIsLive(false)
    setSessionId(null)
    setViewers(0)
    setMessages([])
  }

  const toggleMic = () => {
    localAudioTrack.current?.setEnabled(!micOn)
    setMicOn(m => !m)
  }

  const toggleCam = () => {
    localVideoTrack.current?.setEnabled(!camOn)
    setCamOn(c => !c)
  }

  const sendMsg = (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !socketRef.current) return
    socketRef.current.emit('send_message', {
      sessionId,
      userId:   user?.id,
      userName: user?.name,
      role:     'seller',
      text:     newMsg.trim(),
    })
    setNewMsg('')
  }

  const showcaseProduct = (product) => {
    socketRef.current?.emit('trigger_ar', {
      sessionId,
      productId: product.id,
      arMode:    product.ar_mode,
    })
    setMessages(prev => [...prev, {
      id:   Date.now(),
      user: 'System',
      role: 'system',
      text: `📦 Showcasing: ${product.name}`,
    }])
  }

  // ── Pre-live screen ───────────────────────────────────────────
  if (!isLive) return (
    <div className="max-w-xl mx-auto">
      <div className="card p-10 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Radio size={36} className="text-red-500"/>
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Go Live</h2>
        <p className="text-gray-500 text-sm mb-8">Start a live shopping session for your buyers</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
        )}
        <button onClick={startLive} disabled={starting} className="btn-primary px-8 py-3 text-base disabled:opacity-60">
          {starting
            ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2 inline-block"/> Starting...</>
            : <><Video size={18} className="inline mr-2"/> Start Live Session</>
          }
        </button>
      </div>
    </div>
  )

  // ── Live screen ───────────────────────────────────────────────
  return (
    <div className="max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">

        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex-1 min-h-[300px]">

            {/* ── Video renders here (Agora uses div, not video tag) ── */}
            <div
              ref={videoContainerRef}
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            />

            {/* Overlay if no video yet */}
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white/50">
                  <VideoOff size={48} className="mx-auto mb-2"/>
                  <p className="text-sm">Camera off</p>
                </div>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Radio size={10}/> LIVE
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              <Users size={11}/> {viewers} viewers
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
              <button onClick={toggleMic} className={`w-10 h-10 rounded-full flex items-center justify-center ${micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500'}`}>
                {micOn ? <Mic size={16} className="text-white"/> : <MicOff size={16} className="text-white"/>}
              </button>
              <button onClick={toggleCam} className={`w-10 h-10 rounded-full flex items-center justify-center ${camOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500'}`}>
                {camOn ? <Video size={16} className="text-white"/> : <VideoOff size={16} className="text-white"/>}
              </button>
              <button onClick={stopLive} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center">
                <X size={16} className="text-white"/>
              </button>
            </div>
          </div>

          {/* Showcase products */}
          {myProducts.length > 0 && (
            <div className="card p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Showcase Products — click to push AR to viewers
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {myProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => showcaseProduct(p)}
                    className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors"
                  >
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover"/>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{p.name}</p>
                      <p className="text-xs text-brand-600 font-bold">₹{Number(p.price).toLocaleString('en-IN')}</p>
                    </div>
                    <Sparkles size={12} className="text-brand-400 flex-shrink-0"/>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-800">Live Chat</p>
            <span className="badge-red">LIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex gap-2 ${msg.role === 'system' ? 'justify-center' : ''}`}>
                {msg.role === 'system' ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">{msg.text}</p>
                ) : (
                  <>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${msg.role === 'seller' ? 'bg-brand-500' : 'bg-gray-400'}`}>
                      {msg.user?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {msg.user}
                        {msg.role === 'seller' && <span className="badge-orange ml-1 text-xs py-0 px-1">You</span>}
                      </p>
                      <div className={`rounded-xl px-3 py-1.5 text-sm ${msg.role === 'seller' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={sendMsg} className="p-3 border-t border-gray-100 flex gap-2">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Reply to buyers..." className="input text-sm flex-1"/>
            <button type="submit" className="btn-primary px-3 py-2"><Send size={14}/></button>
          </form>
        </div>
      </div>
    </div>
  )
}