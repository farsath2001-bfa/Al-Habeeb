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
    const { rows } = await query('SELECT id, title, description, icon, sort_order FROM services ORDER BY sort_order, id')
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

// --- Admin: add / edit / remove projects and services ------------------------
const PROJECT_STATUSES = ['Design Concept', 'Under Construction', 'Completed']
const SERVICE_ICONS = [
  'building', 'gear', 'layers', 'bolt', 'clipboard', 'sofa', 'hardhat',
  'handshake', 'home', 'shield', 'crane', 'blueprint', 'leaf',
]

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

// Pictures must be a web address or a path on this site. Returns null (none), a string, or undefined (not allowed).
const pictureUrl = (value) => {
  const text = clean(value, 500)
  if (!text) return null
  if (/^https?:\/\//i.test(text) || (text.startsWith('/') && !text.startsWith('//'))) return text
  return undefined
}

function parseProject(body = {}) {
  const title = clean(body.title, 160)
  const location = clean(body.location, 120)
  const category = clean(body.category, 80)
  const summary = clean(body.summary, 1000)
  const status = body.status
  const image = pictureUrl(body.image_url)

  if (!title || !location || !category || !summary) {
    return { error: 'Title, location, category and summary are required.' }
  }
  if (!PROJECT_STATUSES.includes(status)) return { error: 'Please choose a valid status.' }
  if (image === undefined) return { error: 'Picture must be a web address (https://...) or a path starting with /.' }

  let floors = null
  if (body.floors !== '' && body.floors !== null && body.floors !== undefined) {
    floors = Number(body.floors)
    if (!Number.isInteger(floors) || floors < 1 || floors > 200) {
      return { error: 'Floors must be a whole number from 1 to 200.' }
    }
  }
  const slug = slugify(clean(body.slug, 80) || title)
  if (!slug) return { error: 'Could not make a web address from the title.' }
  return { values: [slug, title, location, category, status, summary, image, floors] }
}

function parseService(body = {}) {
  const title = clean(body.title, 120)
  const description = clean(body.description, 500)
  const icon = SERVICE_ICONS.includes(body.icon) ? body.icon : 'building'
  const order = body.sort_order === '' || body.sort_order == null ? 0 : Number(body.sort_order)

  if (!title || !description) return { error: 'Title and description are required.' }
  if (!Number.isInteger(order) || order < 0 || order > 999) return { error: 'Order must be a whole number from 0 to 999.' }
  return { values: [title, description, icon, order] }
}

// Turns "already exists" database errors into a friendly message.
const duplicate = (res, what) => res.status(409).json({ error: `${what} already exists. Please choose a different one.` })

router.post(
  '/projects',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const { error, values } = parseProject(req.body)
    if (error) return res.status(400).json({ error })
    try {
      const { rows } = await query(
        `INSERT INTO projects (slug, title, location, category, status, summary, image_url, floors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        values,
      )
      res.status(201).json(rows[0])
    } catch (err) {
      if (err.code === '23505') return duplicate(res, 'A project with this web address (slug)')
      throw err
    }
  }),
)

router.put(
  '/projects/:id',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
    const { error, values } = parseProject(req.body)
    if (error) return res.status(400).json({ error })
    try {
      const { rows } = await query(
        `UPDATE projects
            SET slug = $1, title = $2, location = $3, category = $4, status = $5,
                summary = $6, image_url = $7, floors = $8
          WHERE id = $9 RETURNING *`,
        [...values, id],
      )
      if (!rows.length) return res.status(404).json({ error: 'Not found' })
      res.json(rows[0])
    } catch (err) {
      if (err.code === '23505') return duplicate(res, 'A project with this web address (slug)')
      throw err
    }
  }),
)

router.delete(
  '/projects/:id',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
    const { rowCount } = await query('DELETE FROM projects WHERE id = $1', [id])
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  }),
)

router.post(
  '/services',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const { error, values } = parseService(req.body)
    if (error) return res.status(400).json({ error })
    try {
      const { rows } = await query(
        'INSERT INTO services (title, description, icon, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
        values,
      )
      res.status(201).json(rows[0])
    } catch (err) {
      if (err.code === '23505') return duplicate(res, 'A service with this title')
      throw err
    }
  }),
)

router.put(
  '/services/:id',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
    const { error, values } = parseService(req.body)
    if (error) return res.status(400).json({ error })
    try {
      const { rows } = await query(
        'UPDATE services SET title = $1, description = $2, icon = $3, sort_order = $4 WHERE id = $5 RETURNING *',
        [...values, id],
      )
      if (!rows.length) return res.status(404).json({ error: 'Not found' })
      res.json(rows[0])
    } catch (err) {
      if (err.code === '23505') return duplicate(res, 'A service with this title')
      throw err
    }
  }),
)

router.delete(
  '/services/:id',
  adminLimiter,
  requireAdmin,
  wrap(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
    const { rowCount } = await query('DELETE FROM services WHERE id = $1', [id])
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  }),
)

export default router
