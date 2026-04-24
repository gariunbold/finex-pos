"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { toMoney, datetimeToStr } from "@/lib/format"
import {
  Upload, CheckCircle2, ArrowLeft, CloudUpload, AlertCircle, Receipt, Clock, TrendingUp,
} from "lucide-react"

export default function PosUploadPage() {
  const router = useRouter()
  const { isPaired, posUser, pendingSales, uploadPendingSales } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()
  const [uploading, setUploading] = useState(false)

  // Зөвхөн илгээгээгүй борлуулалтын жагсаалт
  const unsentSales = pendingSales.filter((s: any) => !s.uploaded && !s.isDeleted)

  useEffect(() => {
    if (!isPaired || !posUser) router.replace("/login")
  }, [isPaired, posUser, router])

  const handleUpload = async () => {
    if (unsentSales.length === 0) return alertError("Илгээх борлуулалт байхгүй байна")

    const confirmed = await confirm(
      "Өгөгдөл илгээх",
      `${unsentSales.length} борлуулалтыг server луу илгээх үү?`
    )
    if (!confirmed) return

    setUploading(true)
    showLoading("Өгөгдөл илгээж байна...")
    try {
      const success = await uploadPendingSales()
      hideLoading(); setUploading(false)
      if (success) toastSuccess("Өгөгдөл амжилттай илгээгдлээ")
      else alertError("Өгөгдөл илгээх амжилтгүй", "Дахин оролдоно уу")
    } catch (e: any) {
      hideLoading(); setUploading(false)
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const totalAmount = unsentSales.reduce((sum, sale) => sum + sale.total, 0)
  const hasPending = unsentSales.length > 0
  const itemCount = unsentSales.reduce((sum, s) => sum + (s.items?.length || 0), 0)

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
            <CloudUpload className="relative z-10 h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-none">Өгөгдөл илгээх</div>
            <div className="text-xs text-muted-foreground mt-0.5">Оффлайн борлуулалтыг сервертэй синхрон болгоно</div>
          </div>
        </div>

        {hasPending ? (
          <span className="pill pill-warn tabular">
            <AlertCircle className="h-3.5 w-3.5" />
            {unsentSales.length} илгээгээгүй
          </span>
        ) : (
          <span className="pill pill-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Синхрон
          </span>
        )}
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto slim-scroll p-4 sm:p-8">
        <div className="max-w-[880px] mx-auto space-y-6 fade-up">
          {!hasPending ? (
            <div className="surface-3 p-10 sm:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
              <div className="relative space-y-5">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Бүгд илгээгдсэн</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Таны төхөөрөмжид илгээгээгүй борлуулалт байхгүй. Касс үргэлжлүүлнэ үү.
                  </p>
                </div>
                <button
                  onClick={() => router.replace("/sale")}
                  className="h-11 px-6 rounded-2xl bg-card border border-border hover:bg-muted text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Борлуулалт дэлгэц рүү буцах
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Hero summary */}
              <div className="surface-3 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-end">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Илгээх нийт дүн</div>
                    <div className="flex items-baseline gap-2 mt-1 tabular">
                      <span className="text-5xl sm:text-6xl font-bold tracking-tight">{toMoney(totalAmount)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="pill tabular">
                        <Receipt className="h-3.5 w-3.5" />
                        {unsentSales.length} борлуулалт
                      </span>
                      <span className="pill tabular">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {itemCount} зүйл
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="sheen group h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--primary)_60%,transparent)] hover:brightness-110 active:translate-y-px transition-all disabled:opacity-50"
                  >
                    <Upload className={`h-[16px] w-[16px] ${uploading ? "animate-pulse" : ""}`} />
                    {uploading ? "Илгээж байна..." : "Бүгдийг илгээх"}
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="surface-1 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                  <span className="text-sm font-semibold">Илгээгдээгүй жагсаалт</span>
                  <span className="text-xs text-muted-foreground tabular">{unsentSales.length} бичилт</span>
                </div>
                <div className="max-h-[460px] overflow-y-auto slim-scroll divide-y divide-border/50">
                  {unsentSales.map((sale, index) => (
                    <div
                      key={sale.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold tabular">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">
                          {sale.items.length > 0 ? `${sale.items.length} зүйл` : "Жетон бичилт"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {datetimeToStr(sale.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold tabular">{toMoney(sale.total)}</div>
                        <div className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Хүлээгдэж буй
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
