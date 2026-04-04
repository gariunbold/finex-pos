import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { useAlertStore } from './store'

// ── Axios instance ──
// Tauri production mode-д rewrites ажиллахгүй тул backend URL шууд ашиглана
function getBaseURL(): string {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    // Tauri mode: backend-руу шууд холбогдоно
    return localStorage.getItem('api-base-url') || 'http://localhost:8080'
  }
  // Browser dev mode: Next.js rewrites ашиглана
  return '/api'
}

const http = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  try {
    // Вэб admin auth token (зөвхөн /login, /logout зэрэг web admin API endpoint-д)
    // POS endpoint-ууд (/pos/*) Authorization header шаарддаггүй
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
      // POS mode-д login руу, web mode-д / руу redirect
      const session = localStorage.getItem('session')
      if (session) {
        // POS mode — session байгаа бол redirect хийхгүй (posLogin хариуцна)
      } else {
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
    const res = await http.post<T>(url, data, axiosConfig)
    const result = res.data as any
    if (result && result.error) {
      if (showError) store.alertError(result.error)
      const e = new Error(result.error) as any
      e._handled = true
      throw e
    }
    return res.data
  } catch (err: any) {
    if (!err._handled && showError) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Хүсэлт боловсруулахад алдаа гарлаа'
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
