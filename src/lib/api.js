import { demoApi } from './demoApi.js'

const BASE_URL = '/api'
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export async function api(path, options = {}) {
  if (isDemoMode) return demoApi(path, options)
  const token = localStorage.getItem('maya_token')
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth-login') {
      localStorage.removeItem('maya_token')
      localStorage.removeItem('maya_user')
      window.dispatchEvent(new Event('maya:logout'))
    }
    throw new Error(data.error || 'İşlem sırasında bir sorun oluştu.')
  }
  return data
}

export const formatDate = (value) => value
  ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Henüz yok'
