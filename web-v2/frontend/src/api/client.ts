import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1'

function cookie(name: string) {
  const entry = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.split('=').slice(1).join('=')) : ''
}

export const api = axios.create({ baseURL: API_URL, withCredentials: true, timeout: 15000 })

api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() ?? 'GET'
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = cookie('pos_csrf_token')
    if (csrf) config.headers['X-CSRF-Token'] = csrf
  }
  return config
})

let refreshing: Promise<void> | null = null
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
  if (error.response?.status !== 401 || !original || original._retried || original.url?.includes('/auth/')) throw error
  original._retried = true
  refreshing ??= api.post('/auth/refresh').then(() => undefined).finally(() => { refreshing = null })
  await refreshing
  return api(original)
})

export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string | Array<{ msg: string }> } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
    if (!error.response) return 'Cannot reach the API. Check that the backend is running.'
  }
  return 'Something went wrong. Please try again.'
}
