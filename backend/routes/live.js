const express = require('express')
const { getPool } = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

/* ─── GET /api/live/sessions  ─── active live sessions ──────── */
router.get('/sessions', async (req, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(
      `SELECT ls.*, u.name AS seller_name
       FROM live_sessions ls
       LEFT JOIN users u ON ls.seller_id = u.id
       WHERE ls.status = 'active'
       ORDER BY ls.viewers DESC, ls.started_at DESC`
    )
    return res.json({ success: true, sessions: rows })
  } catch (err) {
    // Return empty array if table doesn't exist yet
    return res.json({ success: true, sessions: [] })
  }
})

/* ─── POST /api/live/start  (seller) ────────────────────────── */
router.post('/start', authenticate, authorize('seller'), async (req, res) => {
  const { title, productIds } = req.body
  try {
    const pool = getPool()
    const channel = `vivmart_${req.user.id}_${Date.now()}`

    const [result] = await pool.execute(
      'INSERT INTO live_sessions (seller_id, title, channel, product_ids, status, viewers) VALUES (?, ?, ?, ?, "active", 0)',
      [req.user.id, title || 'Live Shopping', channel, JSON.stringify(productIds || [])]
    )

    return res.json({
      success:   true,
      sessionId: result.insertId,
      channel,
      agoraAppId: process.env.AGORA_APP_ID || 'YOUR_AGORA_APP_ID',
      // In production, generate a proper Agora token here using the Agora token builder
      // token: generateAgoraToken(channel, req.user.id)
      token: null,  // Pass null in dev; Agora allows null tokens in test mode
    })
  } catch (err) {
    console.error('Start live error:', err)
    return res.status(500).json({ success: false, message: 'Failed to start session' })
  }
})

/* ─── POST /api/live/end/:sessionId  (seller) ───────────────── */
router.post('/end/:sessionId', authenticate, authorize('seller'), async (req, res) => {
  try {
    const pool = getPool()
    await pool.execute(
      'UPDATE live_sessions SET status = "ended", ended_at = NOW() WHERE id = ? AND seller_id = ?',
      [req.params.sessionId, req.user.id]
    )
    return res.json({ success: true, message: 'Session ended' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to end session' })
  }
})

/* ─── PUT /api/live/:sessionId/viewers  (increment/decrement) ── */
router.put('/:sessionId/viewers', async (req, res) => {
  const { action } = req.body // 'join' | 'leave'
  try {
    const pool  = getPool()
    const delta = action === 'join' ? 1 : -1
    await pool.execute(
      'UPDATE live_sessions SET viewers = GREATEST(0, viewers + ?) WHERE id = ?',
      [delta, req.params.sessionId]
    )
    return res.json({ success: true })
  } catch (err) {
    return res.json({ success: true }) // Silent fail
  }
})

module.exports = router
