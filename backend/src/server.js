import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { runInit } from './migrate.js'
import apiRouter from './routes/api.js'

const app = express()
const PORT = process.env.PORT || 5000

// Render (and most hosts) put a proxy in front of the app; needed for correct client IPs.
app.set('trust proxy', 1)

app.use(helmet())

// Only these websites may call the API from a browser.
// CLIENT_URL can hold several addresses separated by commas.
const allowed = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
  }),
)

app.use(express.json({ limit: '50kb' }))

app.get('/', (_req, res) => res.json({ name: 'Al Habeeb API', docs: '/api/health' }))
app.use('/api', apiRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Last-resort error handler: log the real error, show the visitor a safe message.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

async function start() {
  // On first deploy, create the tables automatically (set AUTO_MIGRATE=true).
  if (process.env.AUTO_MIGRATE === 'true') {
    await runInit()
    console.log('Database tables checked / created.')
  }
  app.listen(PORT, () => console.log(`API running on port ${PORT}`))
}

start().catch((err) => {
  console.error('Failed to start:', err.message)
  process.exit(1)
})
