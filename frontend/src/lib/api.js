// In development, Vite forwards "/api" to the backend (see vite.config.js).
// In production (Vercel) set VITE_API_URL to your Render backend address,
// for example: https://al-habeeb-api.onrender.com
const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export const getServices = () => request('/api/services')
export const getProjects = () => request('/api/projects')
export const sendInquiry = (payload) =>
  request('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) })

// --- Admin (needs the secret ADMIN_KEY; used by the /admin page) ---
const withKey = (key) => ({ 'x-admin-key': key })
export const getInquiries = (key) => request('/api/inquiries', { headers: withKey(key) })
export const updateInquiryStatus = (key, id, status) =>
  request(`/api/inquiries/${id}`, { method: 'PATCH', headers: withKey(key), body: JSON.stringify({ status }) })
export const deleteInquiry = (key, id) =>
  request(`/api/inquiries/${id}`, { method: 'DELETE', headers: withKey(key) })
