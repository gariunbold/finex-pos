"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { toMoney, datetimeToStr } from "@/lib/format"
import {
  Upload, CheckCircle2, CloudUpload, Receipt, Trash2,
} from "lucide-react"

export default function PosUploadPage() {
  const router = useRouter()
  const { isPaired, posUser, pendingSales, uploadPendingSales } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()
  const [uploading, setUploading] = useState(false)

  // Илгээгдээгүй бичлэг (устгасан бичлэгийг ч сервер рүү тэмдэглэхийн тулд илгээнэ)
  const unsentAll = pendingSales.filter((s: any) => !s.uploaded)
  const unsentSales = unsentAll.filter((s: any) => !s.isDeleted)
  const unsentDeleted = unsentAll.filter((s: any) => s.isDeleted)

  useEffect(() => {
    if (!isPaired || !posUser) router.replace("/login")
  }, [isPaired, posUser, router])

  const handleUpload = async () => {
    if (unsentAll.length === 0) return alertError("Илгээх борлуулалт байхгүй байна")

    const summary = unsentDeleted.length > 0
      ? `${unsentSales.length} борлуулалт + ${unsentDeleted.length} устгасан бичлэгийг server луу илгээх үү?`
      : `${unsentSales.length} борлуулалтыг server луу илгээх үү?`
    const confirmed = await confirm("Өгөгдөл илгээх", summary)
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
  const hasPending = unsentAll.length > 0

  return (
    <div className="h-full flex flex-col bg-card/85 backdrop-blur-xl">
      {/* Title */}
      <div className="px-5 py-3">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <CloudUpload className="h-5 w-5 text-primary" />
          Өгөгдөл илгээх
        </h1>
      </div>

      {/* Toolbar */}
      <div className="px-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleUpload}
            disabled={uploading || !hasPending}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:brightness-110 active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className={`h-4 w-4 ${uploading ? "animate-pulse" : ""}`} />
            {uploading ? "Илгээж байна..." : "Бүгдийг илгээх"}
          </button>
          {hasPending ? (
            <span className="pill pill-warn tabular">
              <Receipt className="h-3.5 w-3.5" />
              {unsentSales.length} илгээгээгүй
              {unsentDeleted.length > 0 ? ` · ${unsentDeleted.length} устгасан` : ""}
            </span>
          ) : (
            <span className="pill pill-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Бүгд илгээгдсэн
            </span>
          )}
          <div className="ml-auto text-sm text-muted-foreground tabular">
            Илгээх дүн: <span className="font-semibold text-foreground">{toMoney(totalAmount)}</span> ₮
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto auto-scroll bg-muted/15">
        {!hasPending ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-4">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-base font-semibold">Бүгд илгээгдсэн</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Таны төхөөрөмжид илгээгээгүй борлуулалт байхгүй.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm bg-card" style={{ tableLayout: "auto" }}>
            <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">#</th>
                <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Огноо, цаг</th>
                <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Бичиг №</th>
                <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Төрөл</th>
                <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">Дүн</th>
                <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {unsentAll.map((sale: any, idx: number) => (
                <tr
                  key={sale.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-2.5 text-muted-foreground tabular whitespace-nowrap">{idx + 1}</td>
                  <td className="px-3 py-2.5 tabular text-foreground/80 whitespace-nowrap">
                    {datetimeToStr(sale.createdAt)}
                  </td>
                  <td className="px-3 py-2.5 tabular text-foreground/80 whitespace-nowrap">{sale.id}</td>
                  <td className="px-3 py-2.5 text-foreground/80 whitespace-nowrap">
                    {sale.isDeleted
                      ? "Устгасан"
                      : (sale.chips?.length || 0) > 0 && (sale.items?.length || 0) === 0
                        ? "Жетон"
                        : "Борлуулалт"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular whitespace-nowrap">
                    {toMoney(sale.total)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {sale.isDeleted ? (
                      <span className="pill pill-warn">
                        <Trash2 className="h-3 w-3" />
                        Устгасан
                      </span>
                    ) : (
                      <span className="pill pill-warn">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Хүлээгдэж буй
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
