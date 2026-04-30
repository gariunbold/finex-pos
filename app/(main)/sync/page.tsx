"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { datetimeToStr } from "@/lib/format"
import {
  Download, RefreshCw, CloudDownload, Clock, LayoutGrid,
  Utensils, Tag, Percent, DoorOpen, Users, ShoppingBasket, CheckCircle2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export default function PosSyncPage() {
  const router = useRouter()
  const { isPaired, posUser, syncData, syncFromServer } = usePosStore()
  const { alertError, showLoading, hideLoading, toastSuccess } = useAlertStore()
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!isPaired || !posUser) router.replace("/login")
  }, [isPaired, posUser, router])

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
      hideLoading(); setSyncing(false)
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const hasSyncData = syncData.lastSyncAt !== null
  const items: Array<{ label: string; count: number; icon: LucideIcon; color: string }> = [
    { label: "Цэсний бүлэг", count: syncData.menuGroups.length, icon: LayoutGrid, color: "text-violet-600 bg-violet-500/10" },
    { label: "Цэс", count: syncData.menus.length, icon: Utensils, color: "text-emerald-600 bg-emerald-500/10" },
    { label: "Орц найрлага", count: syncData.menuRecipes.length, icon: ShoppingBasket, color: "text-amber-600 bg-amber-500/10" },
    { label: "Үнэ", count: syncData.menuPrices.length, icon: Tag, color: "text-sky-600 bg-sky-500/10" },
    { label: "Хөнгөлөлт", count: syncData.discounts.length, icon: Percent, color: "text-rose-600 bg-rose-500/10" },
    { label: "Танхим", count: syncData.rooms.length, icon: DoorOpen, color: "text-orange-600 bg-orange-500/10" },
    { label: "Ширээ", count: syncData.tables.length, icon: LayoutGrid, color: "text-cyan-600 bg-cyan-500/10" },
    { label: "Хэрэглэгч", count: syncData.posUsers.length, icon: Users, color: "text-indigo-600 bg-indigo-500/10" },
  ]
  const totalCount = items.reduce((s, it) => s + it.count, 0)

  return (
    <div className="h-full flex flex-col bg-card/85 backdrop-blur-xl">
      {/* Title */}
      <div className="px-5 py-3">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <CloudDownload className="h-5 w-5 text-primary" />
          Өгөгдөл татах
        </h1>
      </div>

      {/* Toolbar */}
      <div className="px-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:brightness-110 active:translate-y-px transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Татаж байна..." : hasSyncData ? "Дахин татах" : "Эхлүүлэх"}
          </button>
          {hasSyncData && (
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-muted text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Сүүлд татсан:</span>
              <span className="tabular font-medium">{datetimeToStr(syncData.lastSyncAt)}</span>
            </div>
          )}
          <div className="ml-auto text-sm text-muted-foreground tabular">
            Нийт <span className="font-semibold text-foreground">{totalCount.toLocaleString("mn-MN")}</span> бичлэг
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto auto-scroll bg-muted/15 p-5">
        {hasSyncData ? (
          <div className="rounded-xl bg-card p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((it) => {
                const Icon = it.icon
                return (
                  <div key={it.label} className="rounded-lg bg-muted/50 p-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${it.color}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold tracking-tight tabular leading-none">
                        {it.count.toLocaleString("mn-MN")}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{it.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <CloudDownload className="h-7 w-7" />
            </div>
            <h2 className="text-base font-semibold">Өгөгдөл хоосон байна</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Эхний удаагаа цэс, үнэ, хэрэглэгчдийн жагсаалтыг сервероос татна.
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-5 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:brightness-110 active:translate-y-px transition-all disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
              {syncing ? "Татаж байна..." : "Эхний татах"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
