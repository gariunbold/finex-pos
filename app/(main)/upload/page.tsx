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
    <div className="flex h-full items-center justify-center bg-muted/30">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Өгөгдөл илгээх</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Таны төхөөрөмжид хадгалагдсан борлуулалтыг server луу илгээнэ
          </p>
        </div>

        <Separator />

        {pendingSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <p className="font-medium">Бүх өгөгдөл илгээгдсэн</p>
            <p className="text-sm text-muted-foreground">
              Илгээх борлуулалт байхгүй байна
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                <div className="text-sm text-muted-foreground">Борлуулалт</div>
                <div className="text-2xl font-bold">{pendingSales.length}</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                <div className="text-sm text-muted-foreground">Нийт дүн</div>
                <div className="text-2xl font-bold">{toMoney(totalAmount)}</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-1 flex flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="text-xs text-muted-foreground text-center">Илгээгээгүй</div>
              </div>
            </div>

            <Separator />

            <div className="max-h-64 overflow-y-auto slim-scroll space-y-2">
              {pendingSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {sale.items.length} зүйл
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {datetimeToStr(sale.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{toMoney(sale.total)}</div>
                    <div className="text-xs text-orange-600">Хүлээгдэж байна</div>
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
