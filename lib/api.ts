import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { useAlertStore } from './store'

// ── Tauri HTTP fetch wrapper ──
// Tauri v2 production дээр browser XHR CORS-д блоклогддог
// Тиймээс @tauri-apps/plugin-http-ийн fetch ашиглана
let tauriFetch: typeof globalThis.fetch | null = null

async function initTauriFetch() {
  if (tauriFetch) return tauriFetch
  if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
    try {
      const { fetch } = await import('@tauri-apps/plugin-http')
      tauriFetch = fetch
      return tauriFetch
    } catch {
      // Plugin байхгүй бол browser fetch ашиглана
    }
  }
  return null
}

// ── Base URL ──
const API_BASE = 'https://finex.app.mn/api'

// ── Tauri mode шалгах ──
function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__
}

// ── Axios instance (browser mode-д ашиглана) ──
const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  try {
    if (!config.url?.startsWith('/pos/')) {
      const auth = localStorage.getItem('auth')
      if (auth) {
        const data = JSON.parse(auth)
        if (data.token) {
          config.headers.Authorization = `Bearer ${data.token}`
        }
      }
    }
  } catch { /* ignore */ }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const session = localStorage.getItem('session')
      if (!session) {
        localStorage.removeItem('auth')
        window.location.href = '/'
      }
    }
    return Promise.reject(err)
  },
)

// ── Tauri fetch POST helper ──
async function tauriPost<T>(url: string, data?: any): Promise<T> {
  const tf = await initTauriFetch()
  if (!tf) throw new Error('Tauri fetch unavailable')

  // Auth header
  let authHeader: string | undefined
  try {
    if (!url.startsWith('/pos/')) {
      const auth = localStorage.getItem('auth')
      if (auth) {
        const parsed = JSON.parse(auth)
        if (parsed.token) authHeader = `Bearer ${parsed.token}`
      }
    }
  } catch { /* ignore */ }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Origin': 'https://finex.app.mn',
  }
  if (authHeader) headers['Authorization'] = authHeader

  const response = await tf(`${API_BASE}${url}`, {
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  })

  if (response.status === 401) {
    const session = localStorage.getItem('session')
    if (!session) {
      localStorage.removeItem('auth')
      window.location.href = '/'
    }
  }

  const result = await response.json()
  return result as T
}

// ── API ──
export interface ApiOptions {
  showError?: boolean
  showLoading?: boolean
}

export async function api<T = any>(url: string, data?: any, opts?: ApiOptions & AxiosRequestConfig): Promise<T> {
  const { showError = true, showLoading = true, ...axiosConfig } = opts || {}
  const store = useAlertStore.getState()

  if (showLoading) store.showLoading()
  try {
    let result: any

    if (isTauri()) {
      // Tauri mode: plugin-http ашиглана (CORS bypass)
      result = await tauriPost<T>(url, data)
    } else {
      // Browser mode: Axios ашиглана
      const res = await http.post<T>(url, data, axiosConfig)
      result = res.data
    }

    if (result && result.error) {
      if (showError) store.alertError(result.error)
      const e = new Error(result.error) as any
      e._handled = true
      throw e
    }
    return result
  } catch (err: any) {
    if (!err._handled && showError) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Хүсэлт боловсруулахад алдаа гарлаа'
      if (err.response?.status !== 401) {
        store.alertError(msg)
      }
    }
    throw err
  } finally {
    if (showLoading) store.hideLoading()
  }
}

export async function apiDownload(url: string, data?: any, filename?: string) {
  const store = useAlertStore.getState()
  store.showLoading()
  try {
    const res = await http.post(url, data, { responseType: 'blob' })
    const blob = new Blob([res.data])
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename || 'download'
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    store.alertError('Файл татахад алдаа гарлаа')
  } finally {
    store.hideLoading()
  }
}

export async function apiUpload<T = any>(url: string, formData: FormData): Promise<T> {
  const store = useAlertStore.getState()
  store.showLoading()
  try {
    const res = await http.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  } catch (err) {
    store.alertError('Файл илгээхэд алдаа гарлаа')
    throw err
  } finally {
    store.hideLoading()
  }
}

export { http }
