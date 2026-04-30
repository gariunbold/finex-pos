import { create } from 'zustand'
import { toast as sonnerToast } from 'sonner'
import type { ThemeConfig } from './types'
import { log } from 'console'


// ═════════════════════════════════════════════════════════════════
// THEME STORE
// ═════════════════════════════════════════════════════════════════
export const THEMES: ThemeConfig[] = [
  { id: 'violet', label: 'Нил ягаан', primary: 'oklch(0.627 0.265 303.9)', swatch: '#8b5cf6' },
  { id: 'blue', label: 'Цэнхэр', primary: 'oklch(0.488 0.243 264.376)', swatch: '#3b82f6' },
  { id: 'cyan', label: 'Хөх ногоон', primary: 'oklch(0.696 0.17 162.48)', swatch: '#06b6d4' },
  { id: 'green', label: 'Ногоон', primary: 'oklch(0.627 0.194 145.566)', swatch: '#22c55e' },
  { id: 'orange', label: 'Улбар шар', primary: 'oklch(0.705 0.213 47.604)', swatch: '#f97316' },
  { id: 'rose', label: 'Ягаан улаан', primary: 'oklch(0.645 0.246 16.439)', swatch: '#f43f5e' },
  { id: 'yellow', label: 'Шар', primary: 'oklch(0.769 0.188 70.08)', swatch: '#eab308' },
]

function applyThemeToDom(theme: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--ring', theme.primary)
  root.style.setProperty('--sidebar-primary', theme.primary)
  root.style.setProperty('--sidebar-ring', theme.primary)
}

interface ThemeState {
  themeId: string
  isDark: boolean
  setTheme: (id: string) => void
  toggleDarkMode: () => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeId: 'blue',
  isDark: false,

  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id)
    if (!theme) return
    set({ themeId: id })
    localStorage.setItem('app-theme', id)
    applyThemeToDom(theme)
  },

  toggleDarkMode: () => {
    const dark = !get().isDark
    set({ isDark: dark })
    localStorage.setItem('app-dark-mode', String(dark))
    document.documentElement.classList.toggle('dark', dark)
  },

  initTheme: () => {
    const savedId = localStorage.getItem('app-theme')
    const theme = THEMES.find(t => t.id === savedId) ?? THEMES.find(t => t.id === 'blue')!
    set({ themeId: theme.id })
    applyThemeToDom(theme)

    const savedDark = localStorage.getItem('app-dark-mode')
    const dark = savedDark === 'true'
    set({ isDark: dark })
    document.documentElement.classList.toggle('dark', dark)
  },
}))

// Helper: current theme-ийг themeId-аас олох
export function getCurrentTheme(themeId: string): ThemeConfig {
  return THEMES.find(t => t.id === themeId) ?? THEMES[0]
}

// ═════════════════════════════════════════════════════════════════
// ALERT STORE
// ═════════════════════════════════════════════════════════════════
export type AlertType = 'error' | 'warning' | 'success' | 'info'

interface AlertState {
  alertOpen: boolean
  alertType: AlertType
  alertTitle: string
  alertMessage: string
  alertMode: 'alert' | 'confirm' | 'prompt'
  promptValue: string
  resolve: ((value: any) => void) | null

  loadingOpen: boolean
  loadingMessage: string
  loadingCount: number

  alertError: (title: string, message?: string) => void
  alertWarning: (title: string, message?: string) => void
  alertSuccess: (title: string, message?: string) => void
  alertInfo: (title: string, message?: string) => void
  confirm: (title: string, message?: string) => Promise<boolean>
  prompt: (title: string, message?: string, defaultValue?: string) => Promise<string | null>
  closeAlert: (result?: any) => void
  setPromptValue: (value: string) => void
  showLoading: (message?: string) => void
  hideLoading: () => void

  toast: (msg: string) => void
  toastSuccess: (msg: string) => void
  toastWarning: (msg: string) => void
  toastError: (msg: string) => void
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alertOpen: false,
  alertType: 'info',
  alertTitle: '',
  alertMessage: '',
  alertMode: 'alert',
  promptValue: '',
  resolve: null,

  loadingOpen: false,
  loadingMessage: '',
  loadingCount: 0,

  alertError: (title, message) => set({
    alertOpen: true, alertType: 'error', alertTitle: title,
    alertMessage: message || '', alertMode: 'alert', resolve: null,
  }),
  alertWarning: (title, message) => set({
    alertOpen: true, alertType: 'warning', alertTitle: title,
    alertMessage: message || '', alertMode: 'alert', resolve: null,
  }),
  alertSuccess: (title, message) => set({
    alertOpen: true, alertType: 'success', alertTitle: title,
    alertMessage: message || '', alertMode: 'alert', resolve: null,
  }),
  alertInfo: (title, message) => set({
    alertOpen: true, alertType: 'info', alertTitle: title,
    alertMessage: message || '', alertMode: 'alert', resolve: null,
  }),

  confirm: (title, message) => new Promise((resolve) => {
    set({
      alertOpen: true, alertType: 'warning', alertTitle: title,
      alertMessage: message || '', alertMode: 'confirm', resolve,
    })
  }),

  prompt: (title, message, defaultValue) => new Promise((resolve) => {
    set({
      alertOpen: true, alertType: 'info', alertTitle: title,
      alertMessage: message || '', alertMode: 'prompt',
      promptValue: defaultValue || '', resolve,
    })
  }),

  closeAlert: (result) => {
    const { alertMode, resolve, promptValue } = get()
    set({ alertOpen: false })
    if (resolve) {
      if (alertMode === 'confirm') resolve(result === true)
      else if (alertMode === 'prompt') resolve(result === false ? null : promptValue)
    }
    set({ resolve: null })
  },

  setPromptValue: (value) => set({ promptValue: value }),

  showLoading: (message) => {
    const count = get().loadingCount + 1
    set({ loadingCount: count, loadingOpen: true, ...(message ? { loadingMessage: message } : {}) })
  },

  hideLoading: () => {
    const count = Math.max(0, get().loadingCount - 1)
    set({ loadingCount: count, ...(count === 0 ? { loadingOpen: false, loadingMessage: '' } : {}) })
  },

  toast: (msg) => sonnerToast(msg),
  toastSuccess: (msg) => sonnerToast.success(msg),
  toastWarning: (msg) => sonnerToast.warning(msg),
  toastError: (msg) => sonnerToast.error(msg),
}))

// ═════════════════════════════════════════════════════════════════
// POS DESKTOP STORE
// ═════════════════════════════════════════════════════════════════
export interface CashSession {
  id?: number
  deviceId: number
  deviceCode: string
  deviceName: string
  userId: number | string  // sid (string) эсвэл id (number)
  userName: string
  openedAt: string
  openingAmount: number
  closingAmount?: number
  closedAt?: string
}

export interface SyncData {
  lastSyncAt: string | null
  menus: any[]
  menuGroups: any[]
  menuRecipes: any[]
  menuPrices: any[]
  rooms: any[]
  tables: any[]
  discounts: any[]
  paymentTypes: any[]
  posUsers: any[]
  dancers: any[]
  isDancerEnabled: number // 0/1 — админаас тохируулна
}

export interface BillItem {
  menuSid: string
  code: string
  name: string
  price: number
  quantity: number
  amount: number
  isCancelled?: boolean
  isPaidService?: boolean
  employeePercent?: number
  employeeAmount?: number
  dancerSid?: string
  dancerName?: string
  isTip?: boolean         // гараар нэмсэн TIP/Бусад орлого
  tipDescription?: string
}

export interface LocalPayment {
  paymentType: string  // BillPaymentType sid
  amount: number
}

// Жетон хуваарилалт — bill-тэй хамт хадгална, upload-д тус тусдаа явна
export interface ChipAssignment {
  id: string                   // local id
  dancerSid: string
  dancerName: string
  quantity: number
  price: number                // нэгж үнэ
  total: number                // quantity * price
  description?: string
  createdAt: string            // ISO
}

export interface LocalBill {
  id: string
  tableSid: string | null   // null = шууд борлуулалт
  tableName: string
  roomSid: string | null
  cashierSid: string
  cashierName: string
  items: BillItem[]
  chips?: ChipAssignment[]
  subtotal: number
  totalAmount: number
  isPaid: boolean
  openDate: string
  closedDate: string | null
  payments: LocalPayment[]
  note: string | null
}

export interface PendingSale {
  id: string
  createdAt: string
  closedAt: string
  docDate?: string  // yyyy.MM.dd — POS-н "ажиллаж буй өдөр". addPendingSale автомат оноож хадгална
  tableSid: string | null
  tableDinnerSid: string | null
  cashierSid: string
  items: BillItem[]
  chips?: ChipAssignment[]
  payments: LocalPayment[]
  total: number
  uploaded: boolean
  isDeleted?: boolean
}

interface PosState {
  isPaired: boolean
  posToken: string | null
  deviceId: number | null
  deviceCode: string | null
  deviceName: string | null
  storeId: number | null
  storeName: string | null
  storePhone: string | null
  storeAddress: string | null
  docDate: string | null  // yyyy.MM.dd — POS ажиллаж буй өдөр
  posUser: any | null
  cashSession: CashSession | null
  syncData: SyncData
  pendingSales: PendingSale[]
  openBills: LocalBill[]

  activateDevice: (activationCode: string, adminCode: string, adminPassword: string) => Promise<boolean>
  unpairDevice: () => void
  restorePosSession: () => void

  posLogin: (code: string, password: string) => Promise<boolean>
  posLogout: () => void

  openCash: (openingAmount: number) => Promise<boolean>
  closeCash: (closingAmount: number) => Promise<boolean>

  syncFromServer: () => Promise<boolean>
  addPendingSale: (sale: PendingSale) => void
  uploadPendingSales: () => Promise<boolean>
  startNewDay: (newDocDate: string) => { ok: boolean; reason?: string }

  // Open bills (ширээн дээрх нээлттэй тооцоо)
  saveOpenBill: (bill: LocalBill) => void
  payOpenBill: (billId: string, payments: LocalPayment[]) => void
  deleteOpenBill: (billId: string) => void
  loadOpenBills: () => Promise<void>
}

export const usePosStore = create<PosState>((set, get) => ({
  isPaired: false,
  posToken: null,
  deviceId: null,
  deviceCode: null,
  deviceName: null,
  storeId: null,
  storeName: null,
  storePhone: null,
  storeAddress: null,
  docDate: null,
  posUser: null,
  cashSession: null,
  syncData: {
    lastSyncAt: null,
    menus: [],
    menuGroups: [],
    menuRecipes: [],
    menuPrices: [],
    discounts: [],
    paymentTypes: [],
    rooms: [],
    tables: [],
    posUsers: [],
    dancers: [],
    isDancerEnabled: 0,
  },
  pendingSales: [],
  openBills: [],

  restorePosSession: () => {
    // localStorage-аас бүх горимд restore хийнэ (Tauri + Browser)
    try {
      const saved = localStorage.getItem('session')
      if (saved) {
        const data = JSON.parse(saved)
        const current = get()
        set({
          isPaired: !!data.posToken,
          posToken: data.posToken || null,
          deviceId: data.deviceId || null,
          deviceCode: data.deviceCode || null,
          deviceName: data.deviceName || null,
          storeId: data.storeId || null,
          storeName: data.storeName || null,
          storePhone: data.storePhone ?? null,
          storeAddress: data.storeAddress ?? null,
          docDate: data.docDate ?? null,
          posUser: current.posUser || data.posUser || null,
          cashSession: current.cashSession || data.cashSession || null,
        })
        // isDancerEnabled-г activation үед хадгалсан байвал syncData-д restore хийнэ
        if (typeof data.isDancerEnabled === 'number') {
          const prevSync = get().syncData
          set({ syncData: { ...prevSync, isDancerEnabled: data.isDancerEnabled } })
        }
      }

      const syncSaved = localStorage.getItem('sync-data')
      if (syncSaved) {
        const parsedSync = JSON.parse(syncSaved)
        // sync-data-д isDancerEnabled байхгүй бол session-ээс авсан утгыг алдагдуулахгүйн тулд merge
        set((s) => ({
          syncData: {
            ...parsedSync,
            isDancerEnabled: typeof parsedSync.isDancerEnabled === 'number'
              ? parsedSync.isDancerEnabled
              : s.syncData.isDancerEnabled,
          },
        }))
      }

      const pendingSaved = localStorage.getItem('pending-sales')
      if (pendingSaved) {
        set({ pendingSales: JSON.parse(pendingSaved) })
      }
    } catch (e) {
      console.error('[RESTORE] localStorage error:', e)
    }

    // Tauri mode: SQLite-аас нэмэлт restore (async, localStorage дээр давхарлана)
    if (typeof window === 'undefined' || !((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) return
    
    // Tauri mode - SQLite ашиглах
    import('./pos-db').then(async (db) => {
      try {
        await db.initPosDatabase()
        
        // Device мэдээлэл
        const device = await db.getDevice()
        if (device) {
          set({
            isPaired: true,
            posToken: device.pos_token,
            deviceId: device.device_id,
            deviceCode: device.device_code,
            deviceName: device.device_name,
            storeId: device.store_id,
            storeName: device.store_name,
            storePhone: device.store_phone ?? null,
            storeAddress: device.store_address ?? null,
            docDate: device.doc_date ?? null,
          })
        }
        
        // User session
        const userSession = await db.getUserSession()
        if (userSession && userSession.user_sid) {
          const deviceState = get()
          set({
            posUser: {
              sid: userSession.user_sid,
              name: userSession.user_name,
            },
            cashSession: userSession.cash_session_id ? {
              id: userSession.cash_session_id,
              deviceId: deviceState.deviceId!,
              deviceCode: deviceState.deviceCode!,
              deviceName: deviceState.deviceName!,
              userId: userSession.user_sid,
              userName: userSession.user_name,
              openedAt: userSession.cash_opened_at,
              openingAmount: userSession.cash_opening_amount,
            } : null,
          })
        }

        // Sync data (бүх table-аас)
        const [menus, menuGroups, menuPrices, menuRecipes, rooms, tables, discounts, paymentTypes, posUsers] = await Promise.all([
          db.getMenus(),
          db.getMenuGroups(),
          db.getMenuPrices(),
          db.getMenuRecipes(),
          db.getRooms(),
          db.getTables(),
          db.getDiscounts(),
          db.getPaymentTypes(),
          db.getPosUsers(),
        ])

        // SQLite snake_case → camelCase
        const menusWithPrice = menus.map((m: any) => {
          const storePrice = menuPrices.find((mp: any) => mp.menu_sid === m.sid)
          return {
            ...m,
            groupSid: m.group_sid || m.groupSid,
            isActive: m.is_active ?? m.isActive ?? 1,
            price: storePrice?.price ?? m.price ?? 0,
            imageCode: m.image_code || m.imageCode || null,
          }
        })

        const tablesWithCamel = tables.map((t: any) => ({
          ...t,
          roomSid: t.room_sid || t.roomSid,
          storeSid: t.store_sid || t.storeSid,
          isActive: t.is_active ?? t.isActive ?? 1,
        }))

        const roomsWithCamel = rooms.map((r: any) => ({
          ...r,
          storeSid: r.store_sid || r.storeSid,
          isActive: r.is_active ?? r.isActive ?? 1,
        }))

        const ptWithCamel = paymentTypes.map((pt: any) => ({
          ...pt,
          bankSid: pt.bank_sid || pt.bankSid,
          bankCode: pt.bank_code || pt.bankCode,
          bankName: pt.bank_name || pt.bankName,
          accountNumber: pt.account_number || pt.accountNumber,
        }))

        const lastSyncAt = await db.getLastSyncTime()

        // SQLite-д dancers, isDancerEnabled хадгалагддаггүй тул өмнө localStorage-аас
        // сэргээсэн утгыг хадгалж үлдэнэ — нөгөө сэргээж хоосон болгохгүйн тулд
        set((s) => ({
          syncData: {
            lastSyncAt,
            menus: menusWithPrice,
            menuGroups,
            menuRecipes,
            menuPrices,
            discounts,
            paymentTypes: ptWithCamel,
            rooms: roomsWithCamel,
            tables: tablesWithCamel,
            posUsers,
            dancers: s.syncData.dancers || [],
            isDancerEnabled: s.syncData.isDancerEnabled ?? 0,
          },
        }))
        
        // Pending sales
        const pendingSales = await db.getPendingSales()
        set({ pendingSales })
      } catch (e) {
        console.error('[RESTORE] SQLite restore error:', e)
      }
    }).catch((e) => { console.error('[RESTORE] SQLite import error:', e) })
  },

  activateDevice: async (activationCode, adminCode, adminPassword) => {
    const { api } = await import('./api')
    try {
      const res = await api<any>('/pos/activate', { activationCode, adminCode, adminPassword }, { showLoading: false, showError: false })
      // Response 2 бүтэцтэй: { ok:1, data: {pos,store,posUsers} } эсвэл { pos, store, posUsers }
      console.log('[ACTIVATE] Response:', res)
      const d = res.data?.pos ? res.data : res
      if (d.pos) {
        const { pos, store, posUsers } = d
        const initialDocDate = (() => {
          const dt = new Date()
          const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
          return `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`
        })()
        const session = {
          isPaired: true,
          posToken: pos.sid,  // pos.sid-г posToken болгон ашиглана
          deviceId: pos.storeId,
          deviceCode: pos.code,
          deviceName: pos.name,
          storeId: pos.storeId,
          storeName: store?.name || pos.storeName,
          storePhone: store?.phone ?? store?.storePhone ?? null,
          storeAddress: store?.address ?? store?.storeAddress ?? null,
          docDate: initialDocDate,
          posUser: null,
          cashSession: null,
        }
        set(session)

        // Бүжигчин модулийн тохиргоог activation үед шууд авна — sync хийлгүйгээр хэрэглэнэ
        const prevSync = get().syncData
        set({
          syncData: {
            ...prevSync,
            isDancerEnabled: Number(pos.isDancerEnabled) === 1 ? 1 : 0,
          },
        })
        
        // SQLite хадгалах (Tauri mode)
        if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
          import('./pos-db').then(async (db) => {
            await db.saveDevice({
              deviceId: pos.storeId,
              posToken: pos.sid,
              deviceCode: pos.code,
              deviceName: pos.name,
              storeId: pos.storeId,
              storeName: store?.name || pos.storeName,
              storePhone: store?.phone ?? store?.storePhone ?? null,
              storeAddress: store?.address ?? store?.storeAddress ?? null,
              docDate: initialDocDate,
            })
            // PosUsers хадгалах (offline login-д ашиглах)
            if (posUsers && posUsers.length > 0) {
              await db.savePosUsers(posUsers)
            }
          }).catch(() => {})
        }
        
        // localStorage fallback (browser mode)
        const sessionWithUsers = {
          ...session,
          posUsers: posUsers || [],  // PosUsers хадгалах (browser mode login)
          isDancerEnabled: Number(pos.isDancerEnabled) === 1 ? 1 : 0,
        }
        localStorage.setItem('session', JSON.stringify(sessionWithUsers))
        
        return true
      }
      return false
    } catch (err: any) {
      console.error('[ACTIVATE] Error:', err?.message || err, err?.response?.status, err?.response?.data)
      throw err
    }
  },

  unpairDevice: () => {
    set({
      isPaired: false,
      posToken: null,
      deviceId: null,
      deviceCode: null,
      deviceName: null,
      storeId: null,
      storeName: null,
      storePhone: null,
      storeAddress: null,
      docDate: null,
      posUser: null,
      cashSession: null,
      // Бүх локал өгөгдлийг устгана — POS солих үед л
      pendingSales: [],
      openBills: [],
      syncData: {
        lastSyncAt: null,
        menus: [],
        menuGroups: [],
        menuRecipes: [],
        menuPrices: [],
        discounts: [],
        paymentTypes: [],
        rooms: [],
        tables: [],
        posUsers: [],
        dancers: [],
        isDancerEnabled: 0,
      },
    })

    // SQLite устгах
    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      import('./pos-db').then(async (db) => {
        await db.clearDevice()
        await db.clearUserSession()
        // Тохирвол sync data, pending sales зэргийг ч цэвэрлэх — функц байгаа эсэхийг try-catch
        try { await (db as any).clearSyncData?.() } catch {}
        try { await (db as any).clearPendingSales?.() } catch {}
        try { await (db as any).clearOpenBills?.() } catch {}
      }).catch(() => {})
    }

    // localStorage устгах
    localStorage.removeItem('session')
    localStorage.removeItem('pending-sales')
    localStorage.removeItem('open-bills')
    localStorage.removeItem('sync-data')
  },

  posLogin: async (code, password) => {
    const { isPaired } = get()
    if (!isPaired) return false

    // Offline login (code + password check)
    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      try {
        const db = await import('./pos-db')

        const users = await db.getPosUsers()
        if (users.length === 0) return false

        const user = users.find((u: any) => u.code === code && u.password === password)
        if (!user) return false

        const posUser = {
          sid: user.sid,
          code: user.code,
          name: user.name,
          role: user.role,
        }

        set({ posUser, cashSession: null })

        await db.saveUserSession({
          userSid: posUser.sid,
          userName: posUser.name,
          cashSessionId: null,
          cashOpenedAt: null,
          cashOpeningAmount: null,
        })

        const saved = JSON.parse(localStorage.getItem('session') || '{}')
        localStorage.setItem('session', JSON.stringify({ ...saved, posUser, cashSession: null }))

        return true
      } catch {
        return false
      }
    }

    // Browser mode: localStorage fallback
    try {
      const saved = localStorage.getItem('session')
      if (saved) {
        const data = JSON.parse(saved)
        // sync-data дотроос шинэчлэгдсэн posUsers-г авах, байхгүй бол session-ээс
        const syncDataStr = localStorage.getItem('sync-data')
        const syncData = syncDataStr ? JSON.parse(syncDataStr) : null
        const posUsers = syncData?.posUsers || data.posUsers || []

        const user = posUsers.find((u: any) => u.code === code && u.password === password)
        if (user) {
          const posUser = {
            sid: user.sid,
            code: user.code,
            name: user.name,
            role: user.role,
          }
          set({ posUser, cashSession: null })
          localStorage.setItem('session', JSON.stringify({ ...data, posUser }))
          return true
        }
      }
    } catch {}

    return false
  },

  posLogout: () => {
    set({ posUser: null, cashSession: null })
    
    // SQLite устгах
    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      import('./pos-db').then(async (db) => {
        await db.saveUserSession({
          userSid: null,
          userName: null,
          cashSessionId: null,
          cashOpenedAt: null,
          cashOpeningAmount: null,
        })
      }).catch(() => {})
    }

    // localStorage
    const saved = JSON.parse(localStorage.getItem('session') || '{}')
    localStorage.setItem('session', JSON.stringify({
      ...saved,
      posUser: null,
      cashSession: null
    }))
  },

  openCash: async (openingAmount) => {
    const { deviceId, posUser, posToken, deviceCode, deviceName } = get()
    if (!deviceId || !posUser || !posToken || !deviceCode || !deviceName) return false
    
    // Mock offline response (dev mode)
    try {
      const session: CashSession = {
        id: Date.now(), // Temporary session ID
        deviceId,
        deviceCode,
        deviceName,
        userId: posUser.sid,
        userName: posUser.name,
        openedAt: new Date().toISOString(),
        openingAmount,
      }
      
      set({ cashSession: session })
      
      // SQLite хадгалах
      if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
        import('./pos-db').then(async (db) => {
          await db.saveUserSession({
            userSid: posUser.sid,
            userName: posUser.name,
            cashSessionId: session.id,
            cashOpenedAt: session.openedAt,
            cashOpeningAmount: openingAmount,
          })
        }).catch(() => {})
      }
      
      // localStorage
      const saved = JSON.parse(localStorage.getItem('session') || '{}')
      localStorage.setItem('session', JSON.stringify({ ...saved, cashSession: session }))
      return true
    } catch {
      return false
    }
  },

  closeCash: async (closingAmount) => {
    const { cashSession, posUser } = get()
    if (!cashSession) return false

    try {
      // Mock offline close (dev mode)
      set({ cashSession: null })
      
      // SQLite хадгалах
      if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
        import('./pos-db').then(async (db) => {
          await db.saveUserSession({
            userSid: posUser?.sid || null,
            userName: posUser?.name || null,
            cashSessionId: null,
            cashOpenedAt: null,
            cashOpeningAmount: null,
          })
        }).catch(() => {})
      }
      
      // localStorage
      const saved = JSON.parse(localStorage.getItem('session') || '{}')
      localStorage.setItem('session', JSON.stringify({ ...saved, cashSession: null }))
      return true
    } catch {
      return false
    }
  },

  syncFromServer: async () => {
    const { posToken } = get()
    if (!posToken) return false

    try {
      const { api } = await import('./api')
      console.log('[SYNC] Requesting sync with posToken:', posToken)
      
      const res = await api<any>('/pos/syncDownload', { posSid: posToken })
      
      console.log('[SYNC] Response received:', res)

      // Backend response 2 бүтэцтэй ирж болно:
      // 1) { ok: 1, data: { syncDate, menus, ... } } — controller wrap хийсэн
      // 2) { syncDate, menus, menuGroups, ... } — шууд буцаасан
      const d = res.data?.menus ? res.data : res

      if (d.menus) {
        const rawMenus = d.menus || []
        const rawMenuPrices = d.menuPrices || []

        const menus = rawMenus.map((m: any) => {
          const storePrice = rawMenuPrices.find((mp: any) => mp.menuSid === m.sid)
          return {
            ...m,
            // Store-д зориулсан үнэ байвал ашиглах, байхгүй бол menu.price
            price: storePrice?.price ?? m.price ?? 0,
            // Зургийн мэдээлэл
            imageCode: m.imageCode || null,
          }
        })

        const syncData: SyncData = {
          lastSyncAt: d.syncDate || new Date().toISOString(),
          menus,
          menuGroups: d.menuGroups || [],
          menuRecipes: d.menuRecipes || [],
          menuPrices: rawMenuPrices,
          discounts: d.discounts || [],
          paymentTypes: d.paymentTypes || [],
          rooms: d.rooms || [],
          tables: d.tables || [],
          posUsers: d.posUsers || [],
          dancers: d.dancers || [],
          isDancerEnabled: Number(d.pos?.isDancerEnabled) === 1 ? 1 : 0,
        }

        console.log('[SYNC] Sync data processed:', {
          menus: menus.length,
          menuGroups: syncData.menuGroups.length,
          menuPrices: syncData.menuPrices.length,
          discounts: syncData.discounts.length,
          paymentTypes: syncData.paymentTypes.length,
          posUsers: syncData.posUsers.length,
        })

        set({ syncData })

        // SQLite хадгалах
        if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
          try {
            const db = await import('./pos-db')
            await db.saveSyncData({
              menus,
              menuGroups: syncData.menuGroups,
              menuPrices: rawMenuPrices,
              discounts: syncData.discounts,
              paymentTypes: syncData.paymentTypes,
              rooms: syncData.rooms,
              tables: syncData.tables,
            })
            if (syncData.posUsers.length > 0) {
              await db.savePosUsers(syncData.posUsers)
            }
            console.log('[SYNC] SQLite saved, posUsers:', syncData.posUsers.length)
          } catch (e) {
            console.error('[SYNC] SQLite save error:', e)
          }
        }

        // Зургуудыг offline cache хийх
        try {
          const { cacheMenuImages } = await import('@/app/(main)/sale/helpers')
          await cacheMenuImages(menus)
          console.log('[SYNC] Menu images cached')
        } catch (e) {
          console.error('[SYNC] Image cache error:', e)
        }

        // localStorage fallback
        localStorage.setItem('sync-data', JSON.stringify(syncData))

        // session дотор posUsers шинэчлэх (login-д ашиглагддаг)
        const saved = JSON.parse(localStorage.getItem('session') || '{}')
        localStorage.setItem('session', JSON.stringify({ ...saved, posUsers: syncData.posUsers }))

        return true
      }

      console.error('[SYNC] No menus in response:', d)
      return false
    } catch (e) {
      console.error('[SYNC] Error:', e)
      return false
    }
  },

  addPendingSale: (sale) => {
    // docDate автомат оноох: caller-аас өгөөгүй бол POS-н одоогийн ажиллаж буй өдрөөр (эсвэл өнөөдрөөр)
    const fallbackDocDate = (() => {
      const d = new Date()
      const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
    })()
    const stored: PendingSale = {
      ...sale,
      docDate: sale.docDate || get().docDate || fallbackDocDate,
    }
    const pending = [...get().pendingSales, stored]
    set({ pendingSales: pending })

    // SQLite хадгалах
    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      import('./pos-db').then(async (db) => {
        await db.addPendingSale(stored)
      }).catch(() => {})
    }

    // localStorage fallback
    localStorage.setItem('pending-sales', JSON.stringify(pending))
  },

  startNewDay: (newDocDate) => {
    const { pendingSales, openBills, deviceId } = get()
    const unsent = pendingSales.filter((s) => !s.uploaded).length
    if (unsent > 0) {
      return { ok: false, reason: `${unsent} борлуулалт серверт илгээгдээгүй байна. Эхлээд "Илгээх" хуудсаар илгээнэ үү.` }
    }
    const openUnpaid = openBills.filter((b) => !b.isPaid).length
    if (openUnpaid > 0) {
      return { ok: false, reason: `${openUnpaid} ширээн дээр захиалга хаагдаагүй байна.` }
    }
    set({ docDate: newDocDate })
    if (deviceId !== null && typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      import('./pos-db').then((db) => db.updateDeviceDocDate(newDocDate)).catch(() => {})
    }
    const saved = JSON.parse(localStorage.getItem('session') || '{}')
    localStorage.setItem('session', JSON.stringify({ ...saved, docDate: newDocDate }))
    return { ok: true }
  },

  uploadPendingSales: async () => {
    const { api } = await import('./api')
    const { pendingSales, posToken } = get()
    if (!posToken) return true

    // Илгээгээгүй борлуулалт + устгасан тэмдэглэгээтэй бичлэгүүдийг хоёуланг нь сервер рүү
    // илгээнэ — устгасан бичлэг сервер рүү давхар хүргэгдэхгүй давхар нөхцөлтэй (uploaded=true).
    const toUpload = pendingSales.filter((s) => !s.uploaded)
    if (toUpload.length === 0) return true

    try {
      const sales = toUpload.map(s => ({
        localId: s.id,
        tableDinnerSid: s.tableDinnerSid || s.tableSid || null,
        cashierSid: s.cashierSid,
        items: s.items.map(item => ({
          // Бүжигчинтэй холбоотой мөр нь `${menuSid}__${dancerSid}` compound key-тэй — уг menuSid-г сэргээнэ
          menuSid: item.menuSid.includes('__') ? item.menuSid.split('__')[0] : item.menuSid,
          price: item.price,
          quantity: item.quantity,
          isCancelled: !!item.isCancelled,
          employeeSid: item.dancerSid || null,
          employeePercent: item.employeePercent || 0,
          employeeAmount: item.employeeAmount || 0,
        })),
        chips: (s.chips || []).map(c => ({
          dancerSid: c.dancerSid,
          quantity: c.quantity,
          price: c.price,
          description: c.description || null,
          createdAt: c.createdAt,
        })),
        payments: s.payments,
        createdAt: s.createdAt,
        docDate: s.docDate || null,
        isDeleted: !!s.isDeleted,
      }))

      const res = await api<any>('/bill/uploadSales', {
        posSid: posToken,
        sales,
      }, { showLoading: false, showError: false })

      if (res.ok || res.data?.uploaded > 0) {
        // Зөвхөн илгээсэн ID-уудыг тэмдэглэх (хуучин uploaded хэвээрээ)
        const uploadedIds = new Set(toUpload.map(s => s.id))
        const updatedSales = pendingSales.map(s => uploadedIds.has(s.id) ? { ...s, uploaded: true } : s)
        set({ pendingSales: updatedSales })

        if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
          import('./pos-db').then(async (db) => {
            const saleIds = toUpload.map(s => s.id)
            await db.markSalesUploaded(saleIds)
            await db.markBillsUploaded(saleIds)
          }).catch(() => {})
        }

        // localStorage-д бүгд хадгалагдана (uploaded тэмдэглэгээтэй)
        localStorage.setItem('pending-sales', JSON.stringify(updatedSales))
        return true
      }
      return false
    } catch {
      return false
    }
  },

  // ═══ Open Bills (ширээн дээрх нээлттэй тооцоо) ═══

  saveOpenBill: (bill) => {
    const bills = get().openBills.filter(b => b.id !== bill.id)
    const updated = [...bills, bill]
    set({ openBills: updated })

    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      import('./pos-db').then(db => db.saveOpenBill(bill)).catch(() => {})
    }
    localStorage.setItem('open-bills', JSON.stringify(updated))
  },

  payOpenBill: (billId, payments) => {
    const bill = get().openBills.find(b => b.id === billId)
    if (!bill) return

    const now = new Date().toISOString()
    const closedBill = { ...bill, isPaid: true, closedDate: now, payments }

    // openBills-с хасах
    const remaining = get().openBills.filter(b => b.id !== billId)
    set({ openBills: remaining })
    localStorage.setItem('open-bills', JSON.stringify(remaining))

    // pendingSales руу шилжүүлэх
    const sale: PendingSale = {
      id: closedBill.id,
      createdAt: closedBill.openDate,
      closedAt: now,
      tableSid: closedBill.tableSid,
      tableDinnerSid: closedBill.tableSid,
      cashierSid: closedBill.cashierSid,
      items: closedBill.items,
      chips: closedBill.chips,
      payments: closedBill.payments,
      total: closedBill.totalAmount,
      uploaded: false,
    }
    get().addPendingSale(sale)

    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      import('./pos-db').then(db => db.closeBill(billId, payments)).catch(() => {})
    }
  },

  deleteOpenBill: (billId) => {
    const remaining = get().openBills.filter(b => b.id !== billId)
    set({ openBills: remaining })
    localStorage.setItem('open-bills', JSON.stringify(remaining))

    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      import('./pos-db').then(db => db.deleteOpenBill(billId)).catch(() => {})
    }
  },

  loadOpenBills: async () => {
    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      try {
        const db = await import('./pos-db')
        const bills = await db.getOpenBills()
        set({ openBills: bills })
        return
      } catch {}
    }
    try {
      const saved = localStorage.getItem('open-bills')
      if (saved) set({ openBills: JSON.parse(saved) })
    } catch {}
  },
}))
