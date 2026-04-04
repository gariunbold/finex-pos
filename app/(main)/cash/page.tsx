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
        // Logout хийж login руу буцах
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
    <div className="flex h-full items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isCashOpen ? "Касс хаах" : "Касс нээх"}
          </h1>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Төхөөрөмж: <span className="font-medium">{deviceName}</span></div>
            <div>Ажилтан: <span className="font-medium">{posUser?.name}</span></div>
          </div>
        </div>

        <Separator />

        {isCashOpen && (
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Нээсэн:</span>
              <span className="font-medium">{cashSession.openedAt}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Эхлэх дүн:</span>
              <span className="font-medium">{toMoney(cashSession.openingAmount)}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              {isCashOpen ? "Төгсгөх мөнгөн дүн" : "Эхлэх мөнгөн дүн"}
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            {isCashOpen ? (
              <>
                <Button 
                  className="flex-1" 
                  onClick={handleCloseCash}
                >
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
                  Касс нээх
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                >
                  Гарах
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
