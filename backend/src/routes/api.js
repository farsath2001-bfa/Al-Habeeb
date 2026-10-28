import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { query } from '../db.js'
import { notifyNewInquiry } from '../notify.js'

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
    // Fire-and-forget: the visitor gets their answer straight away, and an email problem
    // is only logged (the message is already saved in the database).
    notifyNewInquiry({ name, email, phone, service, message }).catch((err) =>
      console.error('Email alert failed:', err.message),
    )
    res.status(201).json({ ok: true, id: rows[0].id })
  }),
)

// --- Admin: manage the messages (used by the /admin page on the website) ----
// Everything below needs the secret ADMIN_KEY in the "x-admin-key" request header.
// Wrong guesses are limited, and the key is compared in constant time.
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20, // only failed requests count
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
})

function requireAdmin(req, res, next) {
  const expected = Buffer.from(process.env.ADMIN_KEY || '')
  const given = Buffer.from(req.get('x-admin-key') || '')
  const ok = expected.length > 0 && given.length === expected.length && timingSafeEqual(given, expected)
  if (!ok) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

const INQUIRY_STATUSES = ['new', 'contacted', 'closed']

router.get(
  '/inquiries',
  adminLimiter,
  requireAdmin,
  wrap(async (_req, res) => {
    const { rows } = await query('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 500')
    res.json(rows)
  }),
)

router.patch(
  '/inquiries/:id',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const id = Number(req.params.id)
    const status = req.body?.status
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
    if (!INQUIRY_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const { rows } = await query('UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *', [status, id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  }),
)

router.delete(
  '/inquiries/:id',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
    const { rowCount } = await query('DELETE FROM inquiries WHERE id = $1', [id])
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  }),
)

export default router
