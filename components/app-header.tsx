"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { dateToStr, strToDate } from "@/lib/format"
import {
  ShoppingCart, Download, Upload, BarChart3, Banknote, FileText, Coins,
  LogOut, Menu as MenuIcon, User as UserIcon, Sunrise,
  CalendarDays, X, KeyRound, Save,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type NavItem = {
  href: string
  label: string
  icon: typeof ShoppingCart
  match: (pathname: string, mode: string | null) => boolean
}

const NAV_BASE: NavItem[] = [
  { href: "/sale", label: "Борлуулалт", icon: ShoppingCart, match: (p, m) => p === "/sale" && m !== "bills" && m !== "jetons" },
  { href: "/sale?mode=bills", label: "Тооцооны хуудас", icon: FileText, match: (p, m) => p === "/sale" && m === "bills" },
]

const JETON_NAV: NavItem = {
  href: "/sale?mode=jetons", label: "Жетон", icon: Coins, match: (p, m) => p === "/sale" && m === "jetons",
}

const NAV_TAIL: NavItem[] = [
  { href: "/report", label: "Тайлан", icon: BarChart3, match: (p) => p === "/report" },
]

const MORE_NAV: NavItem[] = [
  { href: "/sync", label: "Татах", icon: Download, match: (p) => p === "/sync" },
  { href: "/upload", label: "Илгээх", icon: Upload, match: (p) => p === "/upload" },
  { href: "/cash", label: "Касс", icon: Banknote, match: (p) => p === "/cash" },
]

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentMode = searchParams?.get("mode") ?? null
  const posUser = usePosStore((s) => s.posUser)
  const deviceName = usePosStore((s) => s.deviceName)
  const docDate = usePosStore((s) => s.docDate)
  const startNewDay = usePosStore((s) => s.startNewDay)
  const isDancerMode = usePosStore((s) => s.syncData.isDancerEnabled === 1)
  const posLogout = usePosStore((s) => s.posLogout)

  const NAV: NavItem[] = [
    ...NAV_BASE,
    ...(isDancerMode ? [JETON_NAV] : []),
    ...NAV_TAIL,
  ]
  const { confirm, alertError, toastSuccess } = useAlertStore()

  const [online, setOnline] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [docDateOpen, setDocDateOpen] = useState(false)
  const [pendingDate, setPendingDate] = useState<Date | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    setOnline(navigator.onLine)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])

  const openStartDayModal = () => {
    setPendingDate(docDate ? strToDate(docDate) : new Date())
    setDocDateOpen(true)
  }

  const handleStartNewDay = async () => {
    if (!pendingDate) return
    const newDate = dateToStr(pendingDate)
    if (newDate === docDate) {
      setDocDateOpen(false)
      return
    }
    const ok = await confirm(
      "Өдөр эхлүүлэх",
      `POS-н ажиллах өдрийг ${newDate} рүү шилжүүлэх үү?`,
    )
    if (!ok) return
    const result = startNewDay(newDate)
    if (!result.ok) {
      alertError("Өдөр эхлүүлэх боломжгүй", result.reason || "")
      return
    }
    toastSuccess(`POS-н ажиллах өдөр шинэчлэгдлээ: ${newDate}`)
    setDocDateOpen(false)
  }

  // Огноог сонгох хязгаар: өнөөдрөөс 2 хоногоос өмнөх өдрүүд сонгож болохгүй
  const minSelectableDate = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - 2)
    return d
  })()

  const handleLogout = async () => {
    const confirmed = await confirm("Гарах", "Та системээс гарах уу?")
    if (confirmed) {
      posLogout()
      router.replace("/login")
    }
  }

  const openChangePassword = () => {
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordOpen(true)
  }

  const handleChangePassword = async () => {
    if (!oldPassword.trim()) return alertError("Хуучин нууц үг оруулна уу")
    if (!newPassword.trim()) return alertError("Шинэ нууц үг оруулна уу")
    if (newPassword.length < 4) return alertError("Шинэ нууц үг хамгийн багадаа 4 тэмдэгт байна")
    if (newPassword !== confirmPassword) return alertError("Шинэ нууц үг таарахгүй байна")

    setChangingPassword(true)
    try {
      const { api } = await import("@/lib/api")
      const posState = usePosStore.getState()
      const userSid = posState.posUser?.sid
      const res = await api<any>("/pos/changeUserPassword", {
        posSid: posState.posToken,
        userSid,
        oldPassword,
        newPassword,
      })
      if (res.ok) {
        // Локал syncData.posUsers нууц үг шинэчлэх (offline login-д ашиглана)
        const updatedPosUsers = (posState.syncData.posUsers as any[] || []).map((u: any) =>
          u.sid === userSid ? { ...u, password: newPassword } : u
        )
        usePosStore.setState({
          syncData: { ...posState.syncData, posUsers: updatedPosUsers },
        })

        // SQLite-д бас шинэчилнэ (Tauri mode)
        if (typeof window !== "undefined" && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
          import("@/lib/pos-db").then((db) => db.updatePosUserPassword(userSid, newPassword)).catch(() => {})
        }

        // localStorage sync-data-г шинэчлэх (browser mode fallback)
        try {
          const sd = localStorage.getItem("sync-data")
          if (sd) {
            const parsed = JSON.parse(sd)
            if (Array.isArray(parsed?.posUsers)) {
              parsed.posUsers = parsed.posUsers.map((u: any) =>
                u.sid === userSid ? { ...u, password: newPassword } : u
              )
              localStorage.setItem("sync-data", JSON.stringify(parsed))
            }
          }
          const sess = localStorage.getItem("session")
          if (sess) {
            const parsedSess = JSON.parse(sess)
            if (Array.isArray(parsedSess?.posUsers)) {
              parsedSess.posUsers = parsedSess.posUsers.map((u: any) =>
                u.sid === userSid ? { ...u, password: newPassword } : u
              )
              localStorage.setItem("session", JSON.stringify(parsedSess))
            }
          }
        } catch { /* ignore */ }

        toastSuccess("Нууц үг амжилттай шинэчлэгдлээ")
        setPasswordOpen(false)
      } else {
        alertError("Нууц үг солих амжилтгүй", res.error || "Дахин оролдоно уу")
      }
    } catch (e: any) {
      alertError("Алдаа гарлаа", e?.message || "Сервертэй холбогдож чадсангүй")
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <header className="app-header relative z-30 flex items-center gap-4 px-5 h-14 shrink-0 text-white">
      {/* Logo */}
      <button
        onClick={() => router.push("/sale")}
        className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
      >
        <img
          src="/logo-on-dark.png"
          alt="Finex"
          className="h-7 w-auto select-none pointer-events-none"
          draggable={false}
        />
      </button>

      {/* Main menu */}
      <nav className="flex items-center gap-1 ml-2">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname || "", currentMode)
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}

        {/* More menu (hamburger) */}
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger
            render={(props) => {
              const moreActive = MORE_NAV.some((item) => item.match(pathname || "", currentMode))
              return (
                <button
                  {...props}
                  title="Бусад"
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                    moreActive
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <MenuIcon className="h-4 w-4" />
                </button>
              )
            }}
          />
          <PopoverContent align="start" className="w-48 p-1">
            {MORE_NAV.map((item) => {
              const Icon = item.icon
              const active = item.match(pathname || "", currentMode)
              return (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); setMoreOpen(false) }}
                  className={`w-full h-9 px-3 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {item.label}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
      </nav>

      <div className="flex-1" />

      {/* Online status dot */}
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <button
              {...props}
              type="button"
              aria-label={online ? "Холболттой" : "Офлайн"}
              className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <span className="relative inline-flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                    online ? "bg-emerald-400" : "bg-red-500"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white/20 ${
                    online ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </span>
            </button>
          )}
        />
        <TooltipContent side="bottom">
          {online ? "Холболттой" : "Офлайн"}
        </TooltipContent>
      </Tooltip>

      {/* DocDate (POS ажиллах өдөр) */}
      {docDate && (
        <button
          onClick={openStartDayModal}
          title="POS ажиллах өдөр — дарж өдөр эхлүүлнэ"
          className="h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all text-white/80 hover:text-white hover:bg-white/10 tabular"
        >
          <CalendarDays className="h-4 w-4" />
          <span>{docDate}</span>
        </button>
      )}

      {/* Start day modal */}
      <Dialog open={docDateOpen} onOpenChange={setDocDateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sunrise className="h-5 w-5 text-primary" />
              Өдөр эхлүүлэх
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3 flex justify-center [--cell-size:--spacing(10)]">
              <Calendar
                mode="single"
                selected={pendingDate ?? undefined}
                onSelect={(d) => d && setPendingDate(d)}
                disabled={(date) => date < minSelectableDate}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Шинэ өдөр эхлүүлсний дараа бүх билл, жетон сонгосон огноогоор бүртгэгдэнэ.
              Илгээгдээгүй борлуулалт эсвэл хаагдаагүй ширээний билл байвал шилжүүлэхгүй.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleStartNewDay} disabled={!pendingDate}>
              <Sunrise className="h-4 w-4" />
              Эхлүүлэх
            </Button>
            <Button variant="outline" onClick={() => setDocDateOpen(false)}>
              <X className="h-4 w-4" />
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User */}
      <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <PopoverTrigger
          render={(props) => (
            <button
              {...props}
              title={posUser?.name || "Хэрэглэгч"}
              className="h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all text-white/70 hover:text-white hover:bg-white/10 aria-expanded:bg-white/15 aria-expanded:text-white"
            >
              <UserIcon className="h-4 w-4" />
              <span className="max-w-[120px] truncate">{posUser?.name || "Хэрэглэгч"}</span>
            </button>
          )}
        />
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="w-60 p-1 bg-[#0b0413] text-white border border-white/10 ring-0"
        >
          <div className="px-3 py-2.5 border-b border-white/10 mb-1">
            <div className="text-sm font-semibold truncate">{posUser?.name || "—"}</div>
            {deviceName && (
              <div className="text-xs text-white/55 truncate mt-0.5">{deviceName}</div>
            )}
          </div>

          <button
            onClick={() => { setUserMenuOpen(false); openChangePassword() }}
            className="w-full h-9 px-3 rounded-md text-sm font-medium flex items-center gap-2 text-white/90 hover:bg-white/10 transition-colors text-left"
          >
            <KeyRound className="h-4 w-4 text-primary" />
            Нууц үг солих
          </button>

          <button
            onClick={() => { setUserMenuOpen(false); handleLogout() }}
            className="w-full h-9 px-3 rounded-md text-sm font-medium flex items-center gap-2 text-white/90 hover:bg-destructive/15 hover:text-destructive transition-colors text-left"
          >
            <LogOut className="h-4 w-4 text-destructive" />
            Системээс гарах
          </button>
        </PopoverContent>
      </Popover>

      {/* Change password modal */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Нууц үг солих
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Хуучин нууц үг</label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Шинэ нууц үг</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Шинэ нууц үг давтах</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !changingPassword) handleChangePassword() }}
                placeholder="••••••"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              <Save className="h-4 w-4" />
              {changingPassword ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
            <Button variant="outline" onClick={() => setPasswordOpen(false)} disabled={changingPassword}>
              <X className="h-4 w-4" />
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
