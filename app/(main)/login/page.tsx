"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Smartphone, Lock, LogOut } from "lucide-react"

export default function PosLoginPage() {
  const router = useRouter()
  const { isPaired, deviceName, storeName, activateDevice, unpairDevice, posLogin } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()
  
  const [activationCode, setActivationCode] = useState("")
  const [adminCode, setAdminCode] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [userCode, setUserCode] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    // Restore session from localStorage
    usePosStore.getState().restorePosSession()
  }, [])

  // Device Pairing: Activation Code + Админ баталгаажуулалт
  const handleActivate = async () => {
    if (!activationCode.trim()) {
      alertError("Идэвхжүүлэх код оруулна уу")
      return
    }
    if (!adminCode.trim()) {
      alertError("Админ нэвтрэх нэр оруулна уу")
      return
    }
    if (!adminPassword.trim()) {
      alertError("Админ нууц үг оруулна уу")
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
      alertError("Алдаа гарлаа", e.message || "Сервертэй холбогдож чадсангүй")
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
    <div className="flex h-full items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Finex POS</h1>
          {!isPaired ? (
            <p className="text-sm text-muted-foreground">
              Төхөөрөмж баталгаажуулах
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">{deviceName}</p>
              <p className="text-xs text-muted-foreground">{storeName}</p>
            </div>
          )}
        </div>

        <Separator />

        {!isPaired ? (
          // ═══ Device Pairing: Activation Code ═══
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium mb-1">Хэрхэн баталгаажуулах вэ?</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Вэб систем рүү нэвтэрнэ</li>
                    <li>ПОС Төхөөрөмж цэснээс шинэ төхөөрөмж үүсгэнэ</li>
                    <li>Идэвхжүүлэх кодыг хуулж авна</li>
                    <li>Доорх талбарт оруулна</li>
                  </ol>
                </div>
              </div>
            </div>

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
              <Label htmlFor="adminCode">Админ нэвтрэх нэр</Label>
              <Input
                id="adminCode"
                placeholder="Админ код"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Админ нууц үг</Label>
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
          </div>
        ) : (
          // ═══ User Login: Code + Password ═══
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userCode">Нэвтрэх код</Label>
              <Input
                id="userCode"
                placeholder="Код оруулна уу"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
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
