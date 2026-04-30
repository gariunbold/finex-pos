"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import {
  Lock, LogOut, User, Info, RefreshCw, KeyRound, ShieldCheck, ArrowRight,
  Wifi, WifiOff, Fingerprint, Smartphone, CheckCircle2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function PosLoginPage() {
  const router = useRouter()
  const { isPaired, deviceName, storeName, activateDevice, unpairDevice, posLogin, syncFromServer } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()

  const [activationCode, setActivationCode] = useState("")
  const [adminCode, setAdminCode] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [userCode, setUserCode] = useState("")
  const [password, setPassword] = useState("")
  const passwordRef = useRef<HTMLInputElement>(null)
  const adminPasswordRef = useRef<HTMLInputElement>(null)
  const adminCodeRef = useRef<HTMLInputElement>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [online, setOnline] = useState(true)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    usePosStore.getState().restorePosSession()
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    setOnline(navigator.onLine)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      clearInterval(t)
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])

  const handleActivate = async () => {
    if (!activationCode.trim()) return alertError("Идэвхжүүлэх код оруулна уу")
    if (!adminCode.trim()) return alertError("Хэрэглэгчийн код оруулна уу")
    if (!adminPassword.trim()) return alertError("Хэрэглэгчийн нууц үг оруулна уу")

    showLoading("Төхөөрөмж баталгаажуулж байна...")
    try {
      const success = await activateDevice(activationCode.trim(), adminCode.trim(), adminPassword.trim())
      hideLoading()
      if (success) {
        toastSuccess("Төхөөрөмж амжилттай баталгаажлаа")
        setActivationCode(""); setAdminCode(""); setAdminPassword("")
      } else alertError("Баталгаажуулалт амжилтгүй", "Код буруу эсвэл хүчингүй байна")
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e?.response?.data?.error || e?.message || "Сервертэй холбогдож чадсангүй")
    }
  }

  const handleLogin = async () => {
    if (!userCode.trim()) return alertError("Нэвтрэх код оруулна уу")
    if (!password.trim()) return alertError("Нууц үг оруулна уу")

    showLoading("Нэвтэрч байна...")
    try {
      const success = await posLogin(userCode.trim(), password)
      if (success) {
        const { cashSession, openCash } = usePosStore.getState()
        if (!cashSession) await openCash(0)
        hideLoading()
        router.replace("/sale")
      } else {
        hideLoading()
        alertError("Нэвтрэх амжилтгүй", "Код эсвэл нууц үг буруу байна")
      }
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleUnpair = async () => {
    const { pendingSales } = usePosStore.getState()
    const unsent = pendingSales.filter((s: any) => !s.uploaded && !s.isDeleted).length
    if (unsent > 0) {
      alertError("Илгээгээгүй мэдээлэл байна", `${unsent} борлуулалт серверт илгээгдээгүй байна. Төхөөрөмж солихоос өмнө "Илгээх" дэлгэцээр илгээнэ үү.`)
      return
    }
    const ok = await confirm("Төхөөрөмж солих", "Одоогийн төхөөрөмжийн холболт тасрах ба бүх локал өгөгдөл устах болно. Шинээр баталгаажуулах шаардлагатай. Үргэлжлүүлэх үү?")
    if (ok) {
      unpairDevice()
      toastSuccess("Төхөөрөмжийн холболт тасарлаа")
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    showLoading("Өгөгдөл татаж байна...")
    try {
      const success = await syncFromServer()
      hideLoading()
      setSyncing(false)
      if (success) toastSuccess("Өгөгдөл амжилттай татагдлаа")
      else alertError("Өгөгдөл татах амжилтгүй", "Дахин оролдоно уу")
    } catch (e: any) {
      hideLoading()
      setSyncing(false)
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))
  const timeStr = now ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}` : "—"
  const dateStr = now ? `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())}` : ""

  return (
    <div className="hero-canvas h-full overflow-y-auto slim-scroll flex flex-col">
      <div className="hero-mesh">
        <span /><span /><span />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-end px-6 lg:px-10 py-5 shrink-0">
        <div className="hidden sm:flex items-center gap-2">
          <div className="pill pill-dark tabular">
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {online ? "Холболттой" : "Офлайн"}
          </div>
          <div className="pill pill-dark tabular">{timeStr}</div>
        </div>
      </header>

      {/* Center */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10 min-h-fit">
        <div className="w-full max-w-[440px] space-y-5 fade-up my-auto">
          {/* Logo */}
          <div className="flex justify-center fade-up delay-1">
            <img
              src="/logo-on-dark.png"
              alt="Finex"
              className="h-12 w-auto select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Form card */}
          <div className="glass-dark rounded-3xl px-8 py-7 fade-up delay-2">
            {!isPaired ? (
              <div className="space-y-4">
                <FieldDark
                  label="Идэвхжүүлэх код"
                  icon={<KeyRound className="h-[15px] w-[15px]" />}
                >
                  <input
                    type="text"
                    autoFocus
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        adminCodeRef.current?.focus()
                      }
                    }}
                    placeholder="Баталгаажуулах код"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full bg-transparent border-0 outline-none text-white placeholder:text-white/50 text-sm font-mono"
                  />
                </FieldDark>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold">
                    Хэрэглэгч
                  </span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>

                <FieldDark label="Админы код" icon={<User className="h-[15px] w-[15px]" />}>
                  <input
                    ref={adminCodeRef}
                    type="text"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        adminPasswordRef.current?.focus()
                      }
                    }}
                    placeholder="admin"
                    className="w-full bg-transparent border-0 outline-none text-white placeholder:text-white/50 text-base"
                  />
                </FieldDark>

                <FieldDark label="Нууц үг" icon={<Lock className="h-[15px] w-[15px]" />}>
                  <input
                    ref={adminPasswordRef}
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleActivate() }}
                    placeholder="••••••"
                    className="w-full bg-transparent border-0 outline-none text-white placeholder:text-white/50 text-base"
                  />
                </FieldDark>

                <button
                  onClick={handleActivate}
                  className="sheen group relative w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-px transition-all mt-1"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Баталгаажуулах
                  <ArrowRight className="h-4 w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowInfo(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors pt-1"
                >
                  <Info className="h-3.5 w-3.5" />
                  Хэрхэн идэвхжүүлэх код авах вэ?
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <FieldDark label="Кассчины код" icon={<User className="h-[15px] w-[15px]" />}>
                  <input
                    type="text"
                    autoFocus
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        passwordRef.current?.focus()
                      }
                    }}
                    placeholder="cashier1"
                    className="w-full bg-transparent border-0 outline-none text-white placeholder:text-white/50 text-base"
                  />
                </FieldDark>

                <FieldDark label="Нууц үг" icon={<Lock className="h-[15px] w-[15px]" />}>
                  <input
                    ref={passwordRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
                    placeholder="••••••"
                    className="w-full bg-transparent border-0 outline-none text-white placeholder:text-white/50 text-base"
                  />
                </FieldDark>

                <button
                  onClick={handleLogin}
                  className="sheen group relative w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-px transition-all mt-1"
                >
                  <Fingerprint className="h-4 w-4" />
                  Нэвтрэх
                  <ArrowRight className="h-4 w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                    Шинэчлэх
                  </button>
                  <button
                    onClick={handleUnpair}
                    title="Төхөөрөмж солих"
                    className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="text-center text-sm text-white/35 fade-up delay-3">
            {dateStr}
          </div>
        </div>
      </main>

      {/* Info dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Идэвхжүүлэх код авах
            </DialogTitle>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            {[
              "Вэб системдээ админаар нэвтэрнэ",
              "ПОС Төхөөрөмж цэснээс шинэ төхөөрөмж үүсгэнэ",
              "Идэвхжүүлэх кодыг хуулж авна",
              "Энэ дэлгэц дээр оруулж баталгаажуулна",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-foreground/80 leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FieldDark({
  label, icon, hint, children,
}: {
  label: string
  icon?: React.ReactNode
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-white/85 uppercase tracking-[0.12em]">{label}</label>
        {hint && <span className="text-[11px] text-white/60">{hint}</span>}
      </div>
      <div className="ring-focus h-11 rounded-xl bg-white/[0.06] border border-white/15 flex items-stretch transition-all hover:bg-white/[0.09] hover:border-white/25 overflow-hidden">
        {icon && (
          <div className="flex w-10 shrink-0 items-center justify-center text-white/70 border-r border-white/10">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center px-3">{children}</div>
      </div>
    </div>
  )
}
