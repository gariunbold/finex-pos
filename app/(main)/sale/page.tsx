"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toMoney } from "@/lib/format"
import { Search, ShoppingCart, Trash2, Plus, Minus, Download, Upload, LogOut, DollarSign } from "lucide-react"

interface BillItem {
  menuSid: string
  code: string
  name: string
  price: number
  quantity: number
  amount: number
}

export default function PosSalePage() {
  const router = useRouter()
  const { isPaired, posUser, cashSession, syncData, deviceName, addPendingSale, posLogout } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()

  const [searchMenu, setSearchMenu] = useState("")
  const [selectedGroupSid, setSelectedGroupSid] = useState<string | null>(null)
  const [billItems, setBillItems] = useState<BillItem[]>([])

  useEffect(() => {
    if (!isPaired || !posUser) {
      router.replace("/login")
      return
    }
    if (!cashSession) {
      router.replace("/cash")
      return
    }
  }, [isPaired, posUser, cashSession, router])

  const filteredMenus = syncData.menus.filter((menu: any) => {
    const matchesSearch = !searchMenu ||
      menu.code?.toLowerCase().includes(searchMenu.toLowerCase()) ||
      menu.name?.toLowerCase().includes(searchMenu.toLowerCase())
    const matchesGroup = !selectedGroupSid || menu.groupSid === selectedGroupSid
    return matchesSearch && matchesGroup && menu.isActive !== 0
  })

  const addMenuItem = (menu: any) => {
    const existing = billItems.find(item => item.menuSid === menu.sid)
    if (existing) {
      updateQuantity(menu.sid, existing.quantity + 1)
    } else {
      const price = menu.price || 0
      setBillItems([...billItems, {
        menuSid: menu.sid,
        code: menu.code,
        name: menu.name,
        price,
        quantity: 1,
        amount: price,
      }])
    }
  }

  const updateQuantity = (menuSid: string, newQty: number) => {
    if (newQty <= 0) {
      setBillItems(billItems.filter(item => item.menuSid !== menuSid))
    } else {
      setBillItems(billItems.map(item =>
        item.menuSid === menuSid
          ? { ...item, quantity: newQty, amount: item.price * newQty }
          : item
      ))
    }
  }

  const clearBill = async () => {
    if (billItems.length === 0) return
    const confirmed = await confirm("Билл цэвэрлэх", "Бүх зүйлсийг устгах уу?")
    if (confirmed) {
      setBillItems([])
    }
  }

  const billTotal = billItems.reduce((sum, item) => sum + item.amount, 0)

  const handlePayment = async () => {
    if (billItems.length === 0) {
      alertError("Билл хоосон байна")
      return
    }

    const confirmed = await confirm(
      "Төлөлт хийх",
      `Нийт дүн: ${toMoney(billTotal)}\n\nТөлөлт хийх үү?`
    )
    if (!confirmed) return

    showLoading("Билл хадгалж байна...")
    try {
      const saleId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const sale = {
        id: saleId,
        createdAt: new Date().toISOString(),
        deviceId: usePosStore.getState().deviceId!,
        cashSessionId: cashSession?.id,
        items: billItems,
        total: billTotal,
        uploaded: false,
      }

      addPendingSale(sale)
      hideLoading()
      toastSuccess("Билл амжилттай хадгалагдлаа")
      setBillItems([])
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleSync = () => {
    router.push("/sync")
  }

  const handleUpload = () => {
    router.push("/upload")
  }

  const handleCloseCash = () => {
    router.push("/cash")
  }

  const handleLogout = async () => {
    const confirmed = await confirm("Гарах", "Та системээс гарах уу?")
    if (confirmed) {
      posLogout()
      router.replace("/login")
    }
  }

  return (
    <div className="flex h-full bg-background">
      {/* Left: Menu list */}
      <div className="flex-1 flex flex-col border-r">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{deviceName}</div>
              <div className="text-muted-foreground">{posUser?.name}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSync}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleUpload}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Цэс хайх..."
              value={searchMenu}
              onChange={(e) => setSearchMenu(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Menu groups */}
          <div className="flex gap-2 overflow-x-auto pb-1 slim-scroll">
            <Button
              variant={selectedGroupSid === null ? "default" : "outline"}
              onClick={() => setSelectedGroupSid(null)}
            >
              Бүгд
            </Button>
            {syncData.menuGroups.map((group: any) => (
              <Button
                key={group.sid}
                variant={selectedGroupSid === group.sid ? "default" : "outline"}
                onClick={() => setSelectedGroupSid(group.sid)}
              >
                {group.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {filteredMenus.map((menu: any) => (
            <Card
              key={menu.sid}
              className="p-3 cursor-pointer hover:border-primary transition-colors"
              onClick={() => addMenuItem(menu)}
            >
              <div className="font-medium text-sm">{menu.name}</div>
              <div className="text-xs text-muted-foreground">{menu.code}</div>
              <div className="text-sm font-medium mt-2">{toMoney(menu.price || 0)}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right: Bill */}
      <div className="w-96 flex flex-col border-l bg-muted/30">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="font-bold">Билл</h2>
            </div>
            {billItems.length > 0 && (
              <Button variant="outline" onClick={clearBill}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Bill items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {billItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-2" />
              <p className="text-sm">Билл хоосон байна</p>
            </div>
          ) : (
            billItems.map((item) => (
              <Card key={item.menuSid} className="p-3 space-y-2">
                <div>
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.code}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.menuSid, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.menuSid, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{toMoney(item.price)}</div>
                    <div className="font-medium">{toMoney(item.amount)}</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3 bg-background">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Нийт дүн:</span>
            <span>{toMoney(billTotal)}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handlePayment}
              disabled={billItems.length === 0}
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Төлөлт хийх
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCloseCash}
            >
              Касс хаах
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
