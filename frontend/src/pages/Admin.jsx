import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteInquiry, getInquiries, updateInquiryStatus } from '../lib/api'

// Private leads page: /admin
// Sign in with the ADMIN_KEY from the Render dashboard. The key is kept only for this
// browser tab (sessionStorage) and is sent to the API in the "x-admin-key" header.

const STORAGE_KEY = 'alhabeeb-admin-key'
const STATUSES = ['new', 'contacted', 'closed']
const FILTERS = ['all', ...STATUSES]

const badge = {
  new: 'bg-gold-400 text-navy-950',
  contacted: 'bg-cyan-100 text-cyan-900',
  closed: 'bg-slate-200 text-slate-600',
}

const readKey = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return '' // storage blocked: the key just won't be remembered
  }
}
const writeKey = (value) => {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, value)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage blocked: nothing to do
  }
}

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' })

// CSV cells that start with = + - @ can run as formulas in Excel, so we defuse them.
const csvCell = (v) => {
  let t = String(v ?? '')
  if (/^[=+\-@]/.test(t)) t = `'${t}`
  return `"${t.replace(/"/g, '""')}"`
}

function exportCsv(rows) {
  const head = ['Date (Dubai)', 'Name', 'Email', 'Phone', 'Service', 'Status', 'Message']
  const lines = rows.map((r) =>
    [formatDate(r.created_at), r.name, r.email, r.phone, r.service, r.status, r.message].map(csvCell).join(','),
  )
  const blob = new Blob([`﻿${[head.map(csvCell).join(','), ...lines].join('\r\n')}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `al-habeeb-leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------ LOGIN ------------------------------ */
function Login({ onSubmit, notice }) {
  const [value, setValue] = useState('')
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5 py-16">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onSubmit(value.trim())
        }}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="font-display text-3xl font-extrabold text-navy-900 uppercase">Leads</h1>
        <p className="mt-1 text-sm text-slate-600">Enter the admin key to see website enquiries.</p>
        <input
          type="password"
          autoComplete="current-password"
          aria-label="Admin key"
          placeholder="Admin key"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-5 w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
        />
        {notice && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {notice}
          </p>
        )}
        <button className="mt-4 w-full rounded-md bg-navy-800 py-3 font-semibold text-white transition hover:bg-gold-500">
          Sign in
        </button>
      </form>
    </section>
  )
}

/* ---------------------------- LEAD CARD ---------------------------- */
function LeadCard({ lead, busy, onStatus, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const digits = (lead.phone || '').replace(/\D/g, '')
  const action =
    'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-navy-800 transition hover:border-navy-800'

  return (
    <article className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${busy ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">{lead.name}</h2>
          <p className="text-sm text-slate-500">{formatDate(lead.created_at)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge[lead.status] || badge.closed}`}>
          {lead.status}
        </span>
      </div>

      {lead.service && (
        <p className="mt-3 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {lead.service}
        </p>
      )}
      <p className="mt-3 text-sm whitespace-pre-wrap text-slate-700">{lead.message}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a className={action} href={`mailto:${lead.email}?subject=${encodeURIComponent('Your enquiry - Al Habeeb')}`}>
          Email
        </a>
        {digits && (
          <>
            <a className={action} href={`tel:+${digits}`}>
              Call
            </a>
            <a className={action} href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </>
        )}

        <select
          aria-label={`Status for ${lead.name}`}
          value={lead.status}
          disabled={busy}
          onChange={(e) => onStatus(lead.id, e.target.value)}
          className="ml-auto rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {confirming ? (
          <span className="flex items-center gap-2">
            <button
              onClick={() => onDelete(lead.id)}
              disabled={busy}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white"
            >
              Delete forever
            </button>
            <button onClick={() => setConfirming(false)} className={action}>
              Cancel
            </button>
          </span>
        ) : (
          <button onClick={() => setConfirming(true)} className="px-2 py-1.5 text-sm text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {lead.email}
        {lead.phone ? ` · ${lead.phone}` : ''}
      </p>
    </article>
  )
}

/* ------------------------------ LEADS ------------------------------ */
function Leads({ adminKey, onSignOut }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await getInquiries(adminKey))
    } catch (err) {
      if (err.status === 401) onSignOut('That key was not accepted.')
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [adminKey, onSignOut])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const c = { all: items.length, new: 0, contacted: 0, closed: 0 }
    items.forEach((i) => {
      if (c[i.status] !== undefined) c[i.status] += 1
    })
    return c
  }, [items])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(
      (i) =>
        (filter === 'all' || i.status === filter) &&
        (!q || [i.name, i.email, i.phone, i.service, i.message].some((f) => (f || '').toLowerCase().includes(q))),
    )
  }, [items, filter, search])

  async function changeStatus(id, status) {
    setBusyId(id)
    setError('')
    try {
      const updated = await updateInquiryStatus(adminKey, id, status)
      setItems((list) => list.map((i) => (i.id === id ? updated : i)))
    } catch (err) {
      if (err.status === 401) onSignOut('That key was not accepted.')
      else setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id) {
    setBusyId(id)
    setError('')
    try {
      await deleteInquiry(adminKey, id)
      setItems((list) => list.filter((i) => i.id !== id))
    } catch (err) {
      if (err.status === 401) onSignOut('That key was not accepted.')
      else setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="min-h-[70vh] bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-extrabold text-navy-900 uppercase">Leads</h1>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium">
              Refresh
            </button>
            <button
              onClick={() => exportCsv(visible)}
              disabled={!visible.length}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Export CSV
            </button>
            <button onClick={() => onSignOut('')} className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white">
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
                filter === f
                  ? 'border-navy-800 bg-navy-800 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-navy-800'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
          <input
            type="search"
            aria-label="Search leads"
            placeholder="Search name, email, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-gold-500 sm:w-72"
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {loading && !items.length ? (
            <p className="text-slate-500">Loading leads... the server can take up to a minute to wake up.</p>
          ) : visible.length ? (
            visible.map((lead) => (
              <LeadCard key={lead.id} lead={lead} busy={busyId === lead.id} onStatus={changeStatus} onDelete={remove} />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              {items.length ? 'No leads match this filter.' : 'No enquiries yet. New messages from the contact form appear here.'}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ PAGE ------------------------------ */
export default function Admin() {
  const [adminKey, setAdminKey] = useState(readKey)
  const [notice, setNotice] = useState('')

  // keep this private page out of search engines
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const signOut = useCallback((message = '') => {
    writeKey('')
    setAdminKey('')
    setNotice(typeof message === 'string' ? message : '')
  }, [])

  if (!adminKey) {
    return (
      <Login
        notice={notice}
        onSubmit={(k) => {
          writeKey(k)
          setNotice('')
          setAdminKey(k)
        }}
      />
    )
  }
  return <Leads adminKey={adminKey} onSignOut={signOut} />
}
