const express = require('express')
const { body, validationResult } = require('express-validator')
const { getPool }  = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

/* ─── GET /api/products ─────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const pool = getPool()
    const { category, search, arMode, featured, sellerId, limit = 50, offset = 0 } = req.query

    let sql    = 'SELECT p.*, u.name AS seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.active = 1'
    const params = []

    if (category)  { sql += ' AND p.category = ?';           params.push(category) }
    if (arMode)    { sql += ' AND p.ar_mode = ?';            params.push(arMode) }
    if (featured)  { sql += ' AND p.featured = 1' }
    if (sellerId)  { sql += ' AND p.seller_id = ?';          params.push(parseInt(sellerId)) }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)'
      const q = `%${search}%`
      params.push(q, q, q)
    }

    sql += ' ORDER BY p.featured DESC, p.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [rows] = await pool.execute(sql, params)
    const [countRow] = await pool.execute('SELECT COUNT(*) AS total FROM products WHERE active = 1', [])

    return res.json({ success: true, products: rows, total: countRow[0].total })
  } catch (err) {
    console.error('Products fetch error:', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch products' })
  }
})

/* ─── GET /api/products/:id ─────────────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT p.*, u.name AS seller_name, u.email AS seller_email FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.id = ? AND p.active = 1',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' })
    return res.json({ success: true, product: rows[0] })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product' })
  }
})

/* ─── GET /api/products/:id/model ──────────────────────────── */
router.get('/:id/model', async (req, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT id, name, category, ar_mode, model_url, colors, sizes FROM products WHERE id = ? AND active = 1',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' })
    return res.json({ success: true, ...rows[0] })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch model data' })
  }
})

/* ─── POST /api/products  (seller + admin) ──────────────────── */
router.post('/', authenticate, authorize('seller', 'admin'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg })

  const { name, category, price, original_price, description, image_url, model_url, ar_mode, badge, colors, sizes, featured } = req.body

  try {
    const pool = getPool()
    const [result] = await pool.execute(
      `INSERT INTO products (name, category, ar_mode, price, original_price, description, image_url, model_url, badge, colors, sizes, featured, seller_id, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, category, ar_mode || '3d', price, original_price || null, description || '', image_url || '', model_url || '', badge || '', JSON.stringify(colors || []), JSON.stringify(sizes || []), featured ? 1 : 0, req.user.id]
    )
    return res.status(201).json({ success: true, productId: result.insertId, message: 'Product created successfully' })
  } catch (err) {
    console.error('Create product error:', err)
    return res.status(500).json({ success: false, message: 'Failed to create product' })
  }
})

/* ─── PUT /api/products/:id  (seller owner + admin) ─────────── */
router.put('/:id', authenticate, authorize('seller', 'admin'), async (req, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT seller_id FROM products WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' })

    // Seller can only edit their own products; admin can edit any
    if (req.user.role === 'seller' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own products' })
    }

    const { name, price, description, image_url, featured, active } = req.body
    await pool.execute(
      'UPDATE products SET name = ?, price = ?, description = ?, image_url = ?, featured = ?, active = ?, updated_at = NOW() WHERE id = ?',
      [name, price, description, image_url, featured ? 1 : 0, active !== false ? 1 : 0, req.params.id]
    )
    return res.json({ success: true, message: 'Product updated' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update product' })
  }
})

/* ─── DELETE /api/products/:id  (admin only) ────────────────── */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pool = getPool()
    await pool.execute('UPDATE products SET active = 0 WHERE id = ?', [req.params.id])
    return res.json({ success: true, message: 'Product removed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete product' })
  }
})

module.exports = router
