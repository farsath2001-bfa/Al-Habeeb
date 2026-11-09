import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon'
import {
  createProject,
  createService,
  deleteProject,
  deleteService,
  getProjects,
  getServices,
  updateProject,
  updateService,
} from '../lib/api'

// Add / edit / remove the projects and services shown on the public website.
// Both screens use the same list-and-form component (CrudManager) with different fields.

const input =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30'

const PROJECT_STATUSES = ['Design Concept', 'Under Construction', 'Completed']
const SERVICE_ICONS = [
  'building', 'gear', 'layers', 'bolt', 'clipboard', 'sofa', 'hardhat',
  'handshake', 'home', 'shield', 'crane', 'blueprint', 'leaf',
]

const projectFields = [
  { name: 'title', label: 'Title', required: true },
  { name: 'category', label: 'Category', required: true, list: ['Commercial', 'Residential', 'Industrial', 'Infrastructure'] },
  { name: 'location', label: 'Location', required: true },
  { name: 'status', label: 'Status', type: 'select', options: PROJECT_STATUSES, required: true },
  { name: 'floors', label: 'Floors', type: 'number', hint: 'Optional' },
  { name: 'image_url', label: 'Picture', hint: 'Web address (https://...) or a file on the site, like /images/site-progress.jpg' },
  { name: 'slug', label: 'Web address name', hint: 'Optional. Leave empty to create it from the title.' },
  { name: 'summary', label: 'Summary', type: 'textarea', required: true, wide: true },
]

const serviceFields = [
  { name: 'title', label: 'Title', required: true },
  { name: 'icon', label: 'Icon', type: 'select', options: SERVICE_ICONS },
  { name: 'sort_order', label: 'Order on the page', type: 'number', hint: 'Smaller numbers show first' },
  { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
]

const toForm = (fields, item) =>
  Object.fromEntries(fields.map((f) => [f.name, item?.[f.name] ?? (f.type === 'select' ? f.options[0] : '')]))

function CrudManager({ title, noun, fields, load, onCreate, onUpdate, onDelete, renderItem, defaults, adminKey, onSignOut }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await load())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    refresh()
  }, [refresh])

  const guard = (err) => {
    if (err.status === 401) onSignOut('That key was not accepted.')
    else setError(err.message)
  }

  const open = (item) => {
    setError('')
    setEditing(item)
    setForm(item === 'new' ? { ...toForm(fields, null), ...defaults } : toForm(fields, item))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing === 'new') await onCreate(adminKey, form)
      else await onUpdate(adminKey, editing.id, form)
      setEditing(null)
      await refresh()
    } catch (err) {
      guard(err)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    setError('')
    try {
      await onDelete(adminKey, id)
      setConfirmId(null)
      await refresh()
    } catch (err) {
      guard(err)
    }
  }

  return (
    <section className="min-h-[60vh] bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-extrabold text-navy-900 uppercase">{title}</h1>
          {!editing && (
            <button onClick={() => open('new')} className="rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400">
              Add {noun}
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {editing ? (
          <form onSubmit={save} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-900">{editing === 'new' ? `New ${noun}` : `Edit ${noun}`}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const id = `field-${f.name}`
                const common = {
                  id,
                  name: f.name,
                  required: f.required,
                  value: form[f.name] ?? '',
                  onChange: (e) => setForm({ ...form, [f.name]: e.target.value }),
                  className: input,
                }
                return (
                  <div key={f.name} className={f.wide ? 'sm:col-span-2' : ''}>
                    <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
                      {f.label}
                      {f.required && ' *'}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea rows={4} {...common} />
                    ) : f.type === 'select' ? (
                      <select {...common}>
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input type={f.type === 'number' ? 'number' : 'text'} list={f.list ? `${id}-list` : undefined} {...common} />
                    )}
                    {f.list && (
                      <datalist id={`${id}-list`}>
                        {f.list.map((o) => (
                          <option key={o} value={o} />
                        ))}
                      </datalist>
                    )}
                    {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex gap-3">
              <button disabled={saving} className="rounded-md bg-navy-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gold-500 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            {loading && !items.length ? (
              <p className="text-slate-500">Loading... the server can take up to a minute to wake up.</p>
            ) : items.length ? (
              items.map((item) => (
                <article key={item.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="min-w-0 flex-1">{renderItem(item)}</div>
                  <button onClick={() => open(item)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-navy-800 hover:border-navy-800">
                    Edit
                  </button>
                  {confirmId === item.id ? (
                    <span className="flex items-center gap-2">
                      <button onClick={() => remove(item.id)} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
                        Delete forever
                      </button>
                      <button onClick={() => setConfirmId(null)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(item.id)} className="px-2 py-1.5 text-sm text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                Nothing here yet. The website shows its built-in {noun}s until you add your own.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export function ProjectsManager({ adminKey, onSignOut }) {
  return (
    <CrudManager
      title="Projects"
      noun="project"
      fields={projectFields}
      load={getProjects}
      onCreate={createProject}
      onUpdate={updateProject}
      onDelete={deleteProject}
      adminKey={adminKey}
      onSignOut={onSignOut}
      renderItem={(p) => (
        <div className="flex items-center gap-4">
          {p.image_url ? (
            <img src={p.image_url} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
          ) : (
            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">No picture</div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy-900">{p.title}</p>
            <p className="text-sm text-slate-500">
              {p.category} · {p.location} · {p.status}
              {p.floors ? ` · ${p.floors} floors` : ''}
            </p>
          </div>
        </div>
      )}
    />
  )
}

export function ServicesManager({ adminKey, onSignOut }) {
  return (
    <CrudManager
      title="Services"
      noun="service"
      fields={serviceFields}
      load={getServices}
      onCreate={createService}
      onUpdate={updateService}
      onDelete={deleteService}
      defaults={{ sort_order: 0 }}
      adminKey={adminKey}
      onSignOut={onSignOut}
      renderItem={(s) => (
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-gold-400">
            <Icon name={s.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-navy-900">{s.title}</p>
            <p className="truncate text-sm text-slate-500">{s.description}</p>
          </div>
        </div>
      )}
    />
  )
}
