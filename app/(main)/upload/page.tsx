"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toMoney, datetimeToStr } from "@/lib/format"
import { Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function PosUploadPage() {
  const router = useRouter()
  const { isPaired, posUser, pendingSales, uploadPendingSales } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()
  
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isPaired || !posUser) {
      router.replace("/login")
    }
  }, [isPaired, posUser, router])

  const handleUpload = async () => {
    if (pendingSales.length === 0) {
      alertError("Илгээх борлуулалт байхгүй байна")
      return
    }

    const confirmed = await confirm(
      "Өгөгдөл илгээх",
      `${pendingSales.length} борлуулалтыг server луу илгээх үү?`
    )
    if (!confirmed) return

    setUploading(true)
    showLoading("Өгөгдөл илгээж байна...")
    
    try {
      const success = await uploadPendingSales()
      hideLoading()
      setUploading(false)
      
      if (success) {
        toastSuccess("Өгөгдөл амжилттай илгээгдлээ")
      } else {
        alertError("Өгөгдөл илгээх амжилтгүй", "Дахин оролдоно уу")
      }
    } catch (e: any) {
      hideLoading()
      setUploading(false)
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const totalAmount = pendingSales.reduce((sum, sale) => sum + sale.total, 0)

  return (
    <div className="relative flex h-full items-center justify-center bg-muted/30 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/5 animate-orb-1" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 animate-orb-2" />
      </div>

      <Card className="relative w-full max-w-2xl p-8 space-y-6 animate-card-in shadow-lg border-border/60">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Өгөгдөл илгээх</h1>
              <p className="text-sm text-muted-foreground">
                Таны төхөөрөмжид хадгалагдсан борлуулалтыг server луу илгээнэ
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {pendingSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Бүх өгөгдөл илгээгдсэн</p>
              <p className="text-sm text-muted-foreground mt-1">
                Илгээх борлуулалт байхгүй байна
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl space-y-1">
                <div className="text-sm text-muted-foreground">Борлуулалт</div>
                <div className="text-2xl font-bold">{pendingSales.length}</div>
              </div>
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl space-y-1">
                <div className="text-sm text-muted-foreground">Нийт дүн</div>
                <div className="text-2xl font-bold">{toMoney(totalAmount)}</div>
              </div>
              <div className="bg-orange-500/8 border border-orange-500/15 p-4 rounded-xl flex flex-col items-center justify-center">
                <AlertCircle className="h-7 w-7 text-orange-600" />
                <div className="text-sm text-orange-600 font-medium text-center mt-1">Илгээгээгүй</div>
              </div>
            </div>

            <Separator />

            <div className="max-h-64 overflow-y-auto slim-scroll space-y-1.5">
              {pendingSales.map((sale, index) => (
                <div
                  key={sale.id}
                  className="flex items-center gap-3 bg-muted/40 border border-border/50 p-3 rounded-xl"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {sale.items.length} зүйл
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {datetimeToStr(sale.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{toMoney(sale.total)}</div>
                    <div className="text-sm text-orange-600">Хүлээгдэж байна</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleUpload}
            disabled={uploading || pendingSales.length === 0}
          >
            <Upload className={`h-4 w-4 mr-2 ${uploading ? 'animate-pulse' : ''}`} />
            {uploading ? "Илгээж байна..." : "Өгөгдөл илгээх"}
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
