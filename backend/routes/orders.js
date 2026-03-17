const express = require('express')
const { getPool } = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

/* ─── POST /api/orders  (buyer) ─────────────────────────────── */
router.post('/', authenticate, authorize('buyer'), async (req, res) => {
  const { items, address, paymentMethod, subtotal, shipping, tax, total } = req.body
  if (!items?.length || !address || !total) {
    return res.status(400).json({ success: false, message: 'Missing required order fields' })
  }
  try {
    const pool = getPool()
    const [result] = await pool.execute(
      `INSERT INTO orders (buyer_id, items, address, payment_method, subtotal, shipping, tax, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, JSON.stringify(items), JSON.stringify(address), paymentMethod || 'upi', subtotal || 0, shipping || 0, tax || 0, total]
    )

    // Update stock for each item
    for (const item of items) {
      await pool.execute('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.qty || 1, item.id])
    }

    return res.status(201).json({ success: true, orderId: result.insertId, message: 'Order placed successfully' })
  } catch (err) {
    console.error('Create order error:', err)
    return res.status(500).json({ success: false, message: 'Failed to place order' })
  }
})

/* ─── GET /api/orders  (buyer sees own; seller sees their product orders; admin sees all) */
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getPool()
    let rows

    if (req.user.role === 'buyer') {
      ;[rows] = await pool.execute(
        'SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC',
        [req.user.id]
      )
    } else if (req.user.role === 'seller') {
      // Orders containing this seller's products
      ;[rows] = await pool.execute(
        `SELECT o.* FROM orders o
         WHERE JSON_CONTAINS(o.items, JSON_OBJECT('sellerId', ?))
         ORDER BY o.created_at DESC`,
        [req.user.id]
      )
    } else {
      // Admin sees all
      ;[rows] = await pool.execute('SELECT o.*, u.name AS buyer_name FROM orders o LEFT JOIN users u ON o.buyer_id = u.id ORDER BY o.created_at DESC')
    }

    return res.json({ success: true, orders: rows })
  } catch (err) {
    console.error('Orders fetch error:', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' })
  }
})

/* ─── GET /api/orders/:id ───────────────────────────────────── */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' })

    const order = rows[0]
    // Access control
    if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    return res.json({ success: true, order })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order' })
  }
})

/* ─── PUT /api/orders/:id/status  (seller + admin) ─────────── */
router.put('/:id/status', authenticate, authorize('seller', 'admin'), async (req, res) => {
  const { status } = req.body
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }
  try {
    const pool = getPool()
    await pool.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id])
    return res.json({ success: true, message: `Order status updated to ${status}` })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update order status' })
  }
})

module.exports = router
