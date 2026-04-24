import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { useAlertStore } from './store'

// ── Base URL ──
const API_BASE = 'https://finex.app.mn/api'
//const API_BASE = 'http://localhost:3000/api'

// ── Tauri mode шалгах ──
function isTauri(): boolean {
  return typeof window !== 'undefined' && !!((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
}

// ── Tauri Rust invoke POST ──
// CORS байхгүй — Rust талаас шууд HTTP request хийнэ
async function tauriPost<T>(url: string, data?: any): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core')

  const fullUrl = `${API_BASE}${url}`
  const body = data ? JSON.stringify(data) : '{}'

  const responseText = await invoke<string>('http_post', { url: fullUrl, body })
  return JSON.parse(responseText) as T
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
      // Tauri mode: Rust invoke ашиглана (CORS байхгүй)
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
