"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Smartphone, Lock, LogOut, Monitor, User, Info, RefreshCw } from "lucide-react"
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
  const [showInfo, setShowInfo] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Restore session from localStorage
    usePosStore.getState().restorePosSession()
  }, [])

  // Device Pairing: Activation Code + User table-ийн хэрэглэгчийн баталгаажуулалт
  const handleActivate = async () => {
    if (!activationCode.trim()) {
      alertError("Идэвхжүүлэх код оруулна уу")
      return
    }
    if (!adminCode.trim()) {
      alertError("Хэрэглэгчийн код оруулна уу")
      return
    }
    if (!adminPassword.trim()) {
      alertError("Хэрэглэгчийн нууц үг оруулна уу")
      return
    }

    showLoading("Төхөөрөмж баталгаажуулж байна...")
    try {
      const success = await activateDevice(activationCode.trim(), adminCode.trim(), adminPassword.trim())
      hideLoading()

      if (success) {
        toastSuccess("Төхөөрөмж амжилттай баталгаажлаа")
        setActivationCode("")
        setAdminCode("")
        setAdminPassword("")
      } else {
        alertError("Баталгаажуулалт амжилтгүй", "Код буруу эсвэл хүчингүй байна")
      }
    } catch (e: any) {
      hideLoading()
      const msg = e?.response?.data?.error || e?.message || "Сервертэй холбогдож чадсангүй"
      alertError("Алдаа гарлаа", msg)
    }
  }

  // User Login: Код + Нууц үг (paired device дээр)
  const handleLogin = async () => {
    if (!userCode.trim()) {
      alertError("Нэвтрэх код оруулна уу")
      return
    }
    if (!password.trim()) {
      alertError("Нууц үг оруулна уу")
      return
    }

    showLoading("Нэвтэрч байна...")
    try {
      const success = await posLogin(userCode.trim(), password)
      hideLoading()

      if (success) {
        toastSuccess("Амжилттай нэвтэрлээ")
        const { cashSession } = usePosStore.getState()
        if (cashSession) {
          router.replace("/sale")
        } else {
          router.replace("/cash")
        }
      } else {
        alertError("Нэвтрэх амжилтгүй", "Код эсвэл нууц үг буруу байна")
      }
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e.message)
    }
  }

  // Төхөөрөмж солих (unpair)
  const handleUnpair = async () => {
    const confirmed = await confirm(
      "Төхөөрөмж солих",
      "Үүнийг хийхэд одоогийн төхөөрөмжийн холболт тасрах ба шинээр баталгаажуулах шаардлагатай болно. Үргэлжлүүлэх үү?"
    )
    if (confirmed) {
      unpairDevice()
      toastSuccess("Төхөөрөмжийн холболт тасарлаа")
    }
  }

  // Sync хийх (login screen дээр)
  const handleSync = async () => {
    setSyncing(true)
    showLoading("Өгөгдөл татаж байна...")
    try {
      const success = await syncFromServer()
      hideLoading()
      setSyncing(false)
      if (success) {
        toastSuccess("Өгөгдөл амжилттай татагдлаа")
      } else {
        alertError("Өгөгдөл татах амжилтгүй", "Дахин оролдоно уу")
      }
    } catch (e: any) {
      hideLoading()
      setSyncing(false)
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!isPaired) {
        handleActivate()
      } else {
        handleLogin()
      }
    }
  }

  return (
    <div className="relative flex h-full items-center justify-center bg-muted/30 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/5 animate-orb-1" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/5 animate-orb-2" />
        <div className="absolute top-1/4 right-1/4 h-3 w-3 rounded-full bg-primary/20 animate-dot-pulse" />
        <div className="absolute bottom-1/3 left-1/3 h-2 w-2 rounded-full bg-primary/15 animate-dot-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <Card className="relative w-full max-w-md p-8 space-y-6 animate-card-in shadow-lg border-border/60">
        {/* Logo / Branding */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Monitor className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finex POS</h1>
            {!isPaired ? (
              <p className="text-sm text-muted-foreground mt-1">
                Төхөөрөмж баталгаажуулах
              </p>
            ) : (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary/8 px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">{deviceName}</span>
                <span className="text-sm text-muted-foreground">&middot;</span>
                <span className="text-sm text-muted-foreground">{storeName}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {!isPaired ? (
          // ═══ Device Pairing: Activation Code ═══
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activationCode">Идэвхжүүлэх код</Label>
              <Input
                id="activationCode"
                placeholder="Идэвхжүүлэх код оруулна уу"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-center text-lg font-mono tracking-wider"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="adminCode">Хэрэглэгчийн код</Label>
              <Input
                id="adminCode"
                placeholder="Хэрэглэгчийн нэвтрэх код"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Хэрэглэгчийн нууц үг</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleActivate}
            >
              <Lock className="h-4 w-4 mr-2" />
              Баталгаажуулах
            </Button>

            {/* Заавар — info товч дарахад modal харагдана */}
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={() => setShowInfo(true)}
            >
              <Info className="h-4 w-4" />
              Хэрхэн баталгаажуулах вэ?
            </button>

            <Dialog open={showInfo} onOpenChange={setShowInfo}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Хэрхэн баталгаажуулах вэ?</DialogTitle>
                </DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Smartphone className="h-4 w-4 text-primary" />
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Вэб систем рүү нэвтэрнэ</li>
                    <li>ПОС Төхөөрөмж цэснээс шинэ төхөөрөмж үүсгэнэ</li>
                    <li>Идэвхжүүлэх кодыг хуулж авна</li>
                    <li>Доорх талбарт оруулна</li>
                  </ol>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          // ═══ User Login: Code + Password ═══
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="userCode">ПОС хэрэглэгчийн код</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userCode"
                  placeholder="ПОС хэрэглэгчийн код оруулна уу"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">ПОС хэрэглэгчийн нууц үг</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleLogin}
              >
                Нэвтрэх
              </Button>
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
                title="Өгөгдөл дахин татах (шинэ хэрэглэгч нэмэгдсэн бол)"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={handleUnpair}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
