const express = require('express')
const bcrypt  = require('bcryptjs')
const { getPool } = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

/* ─── GET /api/users  (admin only) ─────────────────────────── */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { role, status, search } = req.query
    let sql = 'SELECT id, name, email, role, phone, status, created_at, last_login FROM users WHERE 1=1'
    const params = []
    if (role)   { sql += ' AND role = ?';              params.push(role) }
    if (status) { sql += ' AND status = ?';            params.push(status) }
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; const q=`%${search}%`; params.push(q,q) }
    sql += ' ORDER BY created_at DESC'
    const [rows] = await pool.execute(sql, params)
    return res.json({ success: true, users: rows })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' })
  }
})

/* ─── GET /api/users/:id  (admin or self) ──────────────────── */
router.get('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }
  try {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone, status, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' })
    return res.json({ success: true, user: rows[0] })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user' })
  }
})

/* ─── PUT /api/users/:id/status  (admin) ───────────────────── */
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  const { status } = req.body
  if (!['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }
  try {
    const pool = getPool()
    await pool.execute('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id])
    return res.json({ success: true, message: `User status updated to ${status}` })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user status' })
  }
})

/* ─── DELETE /api/users/:id  (admin) ───────────────────────── */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  if (req.user.id === parseInt(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' })
  }
  try {
    const pool = getPool()
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', ['suspended', req.params.id])
    return res.json({ success: true, message: 'User account suspended' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to suspend user' })
  }
})

/* ─── GET /api/users/stats/admin  (admin dashboard) ────────── */
router.get('/stats/admin', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const [[userCount]]   = await pool.execute('SELECT COUNT(*) AS cnt FROM users WHERE role = "buyer"')
    const [[sellerCount]] = await pool.execute('SELECT COUNT(*) AS cnt FROM users WHERE role = "seller"')
    const [[productCount]]= await pool.execute('SELECT COUNT(*) AS cnt FROM products WHERE active = 1')
    const [[orderCount]]  = await pool.execute('SELECT COUNT(*) AS cnt FROM orders')
    const [[revenue]]     = await pool.execute('SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != "cancelled"')
    return res.json({
      success: true,
      stats: {
        buyers:   userCount.cnt,
        sellers:  sellerCount.cnt,
        products: productCount.cnt,
        orders:   orderCount.cnt,
        revenue:  revenue.total,
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' })
  }
})

module.exports = router
