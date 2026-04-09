"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { datetimeToStr } from "@/lib/format"
import { Download, RefreshCw, CheckCircle, XCircle } from "lucide-react"

export default function PosSyncPage() {
  const router = useRouter()
  const { isPaired, posUser, syncData, syncFromServer } = usePosStore()
  const { alertError, showLoading, hideLoading, toastSuccess } = useAlertStore()
  
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!isPaired || !posUser) {
      router.replace("/login")
    }
  }, [isPaired, posUser, router])

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

  const handleBack = () => {
    router.back()
  }

  const hasSyncData = syncData.lastSyncAt !== null

  return (
    <div className="relative flex h-full items-center justify-center bg-muted/30 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/5 animate-orb-1" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/5 animate-orb-2" />
      </div>

      <Card className="relative w-full max-w-lg p-8 space-y-6 animate-card-in shadow-lg border-border/60">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Өгөгдөл татах</h1>
              <p className="text-sm text-muted-foreground">
                Server-ээс цэс, үнэ, хөнгөлөлт зэрэг өгөгдлийг татна
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {hasSyncData ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm bg-primary/5 border border-primary/10 p-3 rounded-xl">
              <span className="text-muted-foreground">Сүүлд татсан:</span>
              <span className="font-semibold">{datetimeToStr(syncData.lastSyncAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <SyncItem label="Цэсний бүлэг" count={syncData.menuGroups.length} />
              <SyncItem label="Цэс" count={syncData.menus.length} />
              <SyncItem label="Орц найрлага" count={syncData.menuRecipes.length} />
              <SyncItem label="Үнэ" count={syncData.menuPrices.length} />
              <SyncItem label="Хөнгөлөлт" count={syncData.discounts.length} />
              <SyncItem label="Танхим" count={syncData.rooms.length} />
              <SyncItem label="Ширээ" count={syncData.tables.length} />
              <SyncItem label="Хэрэглэгч" count={syncData.posUsers.length} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80">
              <XCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Өгөгдөл татаагүй байна
            </p>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? "Татаж байна..." : "Өгөгдөл татах"}
          </Button>
          <Button
            variant="outline"
            onClick={handleBack}
          >
            Буцах
          </Button>
        </div>
      </Card>
    </div>
  )
}

function SyncItem({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between bg-muted/40 border border-border/50 p-3 rounded-xl">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {count > 0 ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : null}
        <span className="font-semibold">{count}</span>
      </div>
    </div>
  )
}
