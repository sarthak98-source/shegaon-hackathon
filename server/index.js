/**
 * VivMart Real-Time Socket.io Server (standalone, port 5001)
 * Handles: live chat, viewer count, AR triggers, product showcase
 * NOTE: Socket.io is already embedded inside backend/server.js too.
 *       Run this separately only for microservices architecture.
 */
require('dotenv').config()
const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const cors       = require('cors')

const app    = express()
const server = http.createServer(app)
app.use(cors()); app.use(express.json())

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }
})

// In-memory: { [sessionId]: { viewers: Map, messages: [], products: [] } }
const sessions = {}

const broadcastViewers = (id) => {
  io.to(id).emit('viewer_count', sessions[id]?.viewers?.size || 0)
}

io.on('connection', (socket) => {

  socket.on('start_session', ({ sessionId, sellerId, sellerName, title, products }) => {
    sessions[sessionId] = { sellerId, sellerName, title, viewers: new Map(), messages: [], products: products || [] }
    socket.join(sessionId)
    socket.data = { sessionId, userId: sellerId, userName: sellerName, role: 'seller' }
    sessions[sessionId].viewers.set(socket.id, { role: 'seller', userName: sellerName })
    io.to(sessionId).emit('session_started', { sessionId, sellerName, title, products: sessions[sessionId].products })
  })

  socket.on('join_session', ({ sessionId, userId, userName, role }) => {
    socket.join(sessionId); socket.data = { sessionId, userId, userName, role }
    if (!sessions[sessionId]) sessions[sessionId] = { viewers: new Map(), messages: [], products: [] }
    sessions[sessionId].viewers.set(socket.id, { userId, userName, role })
    broadcastViewers(sessionId)
    const sysMsg = { id: Date.now(), type: 'system', text: `${userName} joined`, time: new Date().toISOString() }
    sessions[sessionId].messages.push(sysMsg)
    io.to(sessionId).emit('new_message', sysMsg)
    socket.emit('message_history', sessions[sessionId].messages.slice(-60))
    socket.emit('products_update', sessions[sessionId].products)
  })

  socket.on('send_message', ({ sessionId, userId, userName, role, text }) => {
    if (!text?.trim()) return
    const msg = { id: Date.now(), type: 'chat', userId, userName, role, text: text.trim(), time: new Date().toISOString() }
    if (sessions[sessionId]) sessions[sessionId].messages.push(msg)
    io.to(sessionId).emit('new_message', msg)
  })

  socket.on('showcase_product', ({ sessionId, product }) => {
    if (sessions[sessionId]) io.to(sessionId).emit('product_showcased', product)
  })

  socket.on('trigger_ar', ({ sessionId, productId, arMode }) => {
    if (socket.data?.role === 'seller') socket.to(sessionId).emit('ar_triggered', { productId, arMode })
  })

  socket.on('end_session', ({ sessionId }) => {
    if (socket.data?.role === 'seller') {
      io.to(sessionId).emit('session_ended', { sessionId })
      delete sessions[sessionId]
    }
  })

  socket.on('leave_session', ({ sessionId, userName }) => {
    socket.leave(sessionId)
    if (sessions[sessionId]) {
      sessions[sessionId].viewers.delete(socket.id)
      broadcastViewers(sessionId)
      const sysMsg = { id: Date.now(), type: 'system', text: `${userName} left`, time: new Date().toISOString() }
      io.to(sessionId).emit('new_message', sysMsg)
    }
  })

  socket.on('disconnect', () => {
    const { sessionId, userName } = socket.data || {}
    if (sessionId && sessions[sessionId]) {
      sessions[sessionId].viewers.delete(socket.id)
      broadcastViewers(sessionId)
    }
  })
})

app.get('/health', (_req, res) => res.json({ status: 'ok', activeSessions: Object.keys(sessions).length }))
app.get('/sessions', (_req, res) => res.json({ sessions: Object.entries(sessions).map(([id, s]) => ({ id, title: s.title, viewers: s.viewers.size })) }))

const PORT = process.env.SOCKET_PORT || 5001
server.listen(PORT, () => console.log(`\n🔴 VivMart Socket.io Server → http://localhost:${PORT}\n`))
