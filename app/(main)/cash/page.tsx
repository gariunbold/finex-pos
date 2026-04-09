"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toMoney } from "@/lib/format"
import { Banknote, Clock, DollarSign, LogOut, LockOpen, Lock } from "lucide-react"

export default function PosCashPage() {
  const router = useRouter()
  const { isPaired, posUser, cashSession, deviceName, openCash, closeCash, posLogout } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()

  const [amount, setAmount] = useState("")

  useEffect(() => {
    if (!isPaired || !posUser) {
      router.replace("/login")
    }
  }, [isPaired, posUser, router])

  const handleOpenCash = async () => {
    const openingAmount = parseFloat(amount)
    if (isNaN(openingAmount) || openingAmount < 0) {
      alertError("Эхлэх мөнгөн дүн буруу байна")
      return
    }

    const confirmed = await confirm(
      "Касс нээх",
      `Эхлэх мөнгөн дүн: ${toMoney(openingAmount)}`
    )
    if (!confirmed) return

    showLoading("Касс нээж байна...")
    try {
      const success = await openCash(openingAmount)
      hideLoading()

      if (success) {
        toastSuccess("Касс амжилттай нээгдлээ")
        router.replace("/sale")
      } else {
        alertError("Касс нээх амжилтгүй", "Дахин оролдоно уу")
      }
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleCloseCash = async () => {
    const closingAmount = parseFloat(amount)
    if (isNaN(closingAmount) || closingAmount < 0) {
      alertError("Төгсгөх мөнгөн дүн буруу байна")
      return
    }

    const confirmed = await confirm(
      "Касс хаах",
      `Төгсгөх мөнгөн дүн: ${toMoney(closingAmount)}\n\nТа биллийн мөнгө, төлөлт зэргийг бүгдийг тооцоолсон эсэхийг шалгана уу.`
    )
    if (!confirmed) return

    showLoading("Касс хааж байна...")
    try {
      const success = await closeCash(closingAmount)
      hideLoading()

      if (success) {
        toastSuccess("Касс амжилттай хаагдлаа")
        posLogout()
        router.replace("/login")
      } else {
        alertError("Касс хаах амжилтгүй", "Дахин оролдоно уу")
      }
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleLogout = async () => {
    const confirmed = await confirm("Гарах", "Та системээс гарах уу?")
    if (confirmed) {
      posLogout()
      router.replace("/login")
    }
  }

  const isCashOpen = !!cashSession

  return (
    <div className="relative flex h-full items-center justify-center bg-muted/30 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/5 animate-orb-1" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 animate-orb-2" />
      </div>

      <Card className="relative w-full max-w-md p-8 space-y-6 animate-card-in shadow-lg border-border/60">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isCashOpen ? "bg-destructive/10" : "bg-primary/10"}`}>
              {isCashOpen
                ? <Lock className="h-6 w-6 text-destructive" />
                : <LockOpen className="h-6 w-6 text-primary" />
              }
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isCashOpen ? "Касс хаах" : "Касс нээх"}
              </h1>
              <p className="text-sm text-muted-foreground">{deviceName}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-medium">{posUser?.name}</span>
          </div>
        </div>

        <Separator />

        {isCashOpen && (
          <div className="space-y-3 bg-muted/50 border border-border/50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Нээлттэй касс
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Нээсэн:</span>
              <span className="font-medium">{cashSession.openedAt}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Эхлэх дүн:</span>
              <span className="font-bold text-primary">{toMoney(cashSession.openingAmount)}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              {isCashOpen ? "Төгсгөх мөнгөн дүн" : "Эхлэх мөнгөн дүн"}
            </Label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="pl-9 text-lg font-medium"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isCashOpen ? (
              <>
                <Button
                  className="flex-1"
                  onClick={handleCloseCash}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Касс хаах
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.replace("/sale")}
                >
                  Буцах
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1"
                  onClick={handleOpenCash}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Касс нээх
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
