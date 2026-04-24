"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { datetimeToStr } from "@/lib/format"
import {
  Download, RefreshCw, ArrowLeft, CloudDownload, Clock, LayoutGrid,
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
    { label: "Цэсний бүлэг", count: syncData.menuGroups.length, icon: LayoutGrid, color: "text-violet-500 bg-violet-500/10" },
    { label: "Цэс", count: syncData.menus.length, icon: Utensils, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Орц найрлага", count: syncData.menuRecipes.length, icon: ShoppingBasket, color: "text-amber-500 bg-amber-500/10" },
    { label: "Үнэ", count: syncData.menuPrices.length, icon: Tag, color: "text-sky-500 bg-sky-500/10" },
    { label: "Хөнгөлөлт", count: syncData.discounts.length, icon: Percent, color: "text-rose-500 bg-rose-500/10" },
    { label: "Танхим", count: syncData.rooms.length, icon: DoorOpen, color: "text-orange-500 bg-orange-500/10" },
    { label: "Ширээ", count: syncData.tables.length, icon: LayoutGrid, color: "text-cyan-500 bg-cyan-500/10" },
    { label: "Хэрэглэгч", count: syncData.posUsers.length, icon: Users, color: "text-indigo-500 bg-indigo-500/10" },
  ]

  return (
    <div className="surface-page h-full flex flex-col">
      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted flex items-center justify-center transition-colors"
            title="Буцах"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="mono-mark scale-[0.85] origin-left">
            <CloudDownload className="relative z-10 h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-none">Өгөгдөл татах</div>
            <div className="text-xs text-muted-foreground mt-0.5">Серверээс цэс, үнэ, хэрэглэгч шинэчлэх</div>
          </div>
        </div>

        {hasSyncData && (
          <span className="pill tabular">
            <Clock className="h-3.5 w-3.5" />
            {datetimeToStr(syncData.lastSyncAt)}
          </span>
        )}
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto slim-scroll p-4 sm:p-8">
        <div className="max-w-[880px] mx-auto space-y-6 fade-up">
          {hasSyncData ? (
            <>
              {/* Hero stat */}
              <div className="surface-3 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/8 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Нийт бичлэг</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-6xl font-bold tracking-tight tabular">
                        {items.reduce((s, it) => s + it.count, 0).toLocaleString("mn-MN")}
                      </span>
                      <span className="text-lg text-muted-foreground">бичлэг</span>
                    </div>
                    <div className="mt-2 pill pill-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Хамгийн сүүлд амжилттай татагдсан
                    </div>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="sheen group h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--primary)_60%,transparent)] hover:brightness-110 active:translate-y-px transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-[16px] w-[16px] ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Татаж байна..." : "Дахин татах"}
                  </button>
                </div>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {items.map((it) => {
                  const Icon = it.icon
                  return (
                    <div key={it.label} className="surface-1 p-4">
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
            </>
          ) : (
            <div className="surface-3 p-10 sm:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="relative space-y-5">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <CloudDownload className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Өгөгдөл хоосон байна</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Эхний удаагаа цэс, үнэ, хэрэглэгчдийн жагсаалтыг сервероос татна.
                  </p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="sheen group h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold text-base inline-flex items-center gap-2 shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--primary)_60%,transparent)] hover:brightness-110 active:translate-y-px transition-all disabled:opacity-50"
                >
                  <Download className={`h-[18px] w-[18px] ${syncing ? "animate-pulse" : ""}`} />
                  {syncing ? "Татаж байна..." : "Эхний татах"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
