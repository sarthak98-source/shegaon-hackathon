const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const { getPool }  = require('../config/db')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const JWT_SECRET  = process.env.JWT_SECRET  || 'vivmart_secret'
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/register
───────────────────────────────────────────────────────────── */
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
], async (req, res) => {
  // Validate
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg })
  }

  const { name, email, password, role = 'buyer' } = req.body

  try {
    const pool = getPool()

    // Check existing
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }

    // Hash password
    const hashedPw = await bcrypt.hash(password, 12)

    // Insert user (admin role not registerable publicly)
    const safeRole = role === 'admin' ? 'buyer' : role
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPw, safeRole]
    )

    const user = { id: result.insertId, name, email, role: safeRole }
    const token = signToken(user)

    return res.status(201).json({ success: true, user, token })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' })
  }
})

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/login
───────────────────────────────────────────────────────────── */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { email, password } = req.body

  try {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const dbUser = rows[0]
    const valid  = await bcrypt.compare(password, dbUser.password)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    if (dbUser.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' })
    }

    const user  = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role }
    const token = signToken(user)

    // Update last login
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [dbUser.id])

    return res.json({ success: true, user, token })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' })
  }
})

/* ─────────────────────────────────────────────────────────────
   GET /api/auth/profile  (protected)
───────────────────────────────────────────────────────────── */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const pool  = getPool()
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone, avatar_url, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' })
    return res.json({ success: true, user: rows[0] })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' })
  }
})

/* ─────────────────────────────────────────────────────────────
   PUT /api/auth/profile  (protected)
───────────────────────────────────────────────────────────── */
router.put('/profile', authenticate, async (req, res) => {
  const { name, phone } = req.body
  try {
    const pool = getPool()
    await pool.execute('UPDATE users SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?', [name, phone, req.user.id])
    return res.json({ success: true, message: 'Profile updated' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' })
  }
})

module.exports = router
