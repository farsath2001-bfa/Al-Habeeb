import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { query } from '../db.js'

const router = Router()

// Small helper so an error inside an async route is passed to the error handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// --- Health check (Render uses this to know the server is alive) -----------
router.get(
  '/health',
  wrap(async (_req, res) => {
    await query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  }),
)

// --- Services ---------------------------------------------------------------
router.get(
  '/services',
  wrap(async (_req, res) => {
    const { rows } = await query('SELECT id, title, description, icon FROM services ORDER BY sort_order, id')
    res.json(rows)
  }),
)

// --- Projects ---------------------------------------------------------------
router.get(
  '/projects',
  wrap(async (req, res) => {
    const { status } = req.query
    const { rows } = status
      ? await query('SELECT * FROM projects WHERE status = $1 ORDER BY id', [status])
      : await query('SELECT * FROM projects ORDER BY id')
    res.json(rows)
  }),
)

router.get(
  '/projects/:slug',
  wrap(async (req, res) => {
    const { rows } = await query('SELECT * FROM projects WHERE slug = $1', [req.params.slug])
    if (!rows.length) return res.status(404).json({ error: 'Project not found' })
    res.json(rows[0])
  }),
)

// --- Contact form -----------------------------------------------------------
// Max 8 messages per IP every 15 minutes, to stop spam bots.
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
})

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

router.post(
  '/inquiries',
  inquiryLimiter,
  wrap(async (req, res) => {
    const name = clean(req.body.name, 120)
    const email = clean(req.body.email, 160)
    const phone = clean(req.body.phone, 40)
    const service = clean(req.body.service, 120)
    const message = clean(req.body.message, 4000)

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }

    // $1, $2... are placeholders: the driver sends values separately,
    // which prevents SQL injection. Never build SQL by joining strings.
    const { rows } = await query(
      `INSERT INTO inquiries (name, email, phone, service, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [name, email, phone || null, service || null, message],
    )
    res.status(201).json({ ok: true, id: rows[0].id })
  }),
)

// Read the messages (for the company). Protected by a secret key in the request header:
//   curl -H "x-admin-key: YOUR_KEY" http://localhost:5000/api/inquiries
router.get(
  '/inquiries',
  wrap(async (req, res) => {
    const key = process.env.ADMIN_KEY
    if (!key || req.get('x-admin-key') !== key) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const { rows } = await query('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200')
    res.json(rows)
  }),
)

export default router
