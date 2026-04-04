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
    
    // Debug: localStorage шалгах
    const session = localStorage.getItem('session')
    console.log('[DEBUG] localStorage session:', session)
    if (session) {
      const parsed = JSON.parse(session)
      console.log('[DEBUG] Parsed session:', {
        isPaired: parsed.isPaired,
        posToken: parsed.posToken,
        deviceId: parsed.deviceId,
      })
    }
    
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
    <div className="flex h-full items-center justify-center bg-muted/30">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Өгөгдөл татах</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Server-ээс цэс, үнэ, хөнгөлөлт зэрэг өгөгдлийг татна
          </p>
        </div>

        <Separator />

        {hasSyncData ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Сүүлд татсан:</span>
              <span className="font-medium">{datetimeToStr(syncData.lastSyncAt)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
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
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <XCircle className="h-12 w-12 text-muted-foreground" />
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
    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {count > 0 ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : null}
        <span className="font-medium">{count}</span>
      </div>
    </div>
  )
}
