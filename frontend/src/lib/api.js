// In development, Vite forwards "/api" to the backend (see vite.config.js).
// In production (Vercel) set VITE_API_URL to your Render backend address,
// for example: https://al-habeeb-api.onrender.com
const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export const getServices = () => request('/api/services')
export const getProjects = () => request('/api/projects')
export const sendInquiry = (payload) =>
  request('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) })
