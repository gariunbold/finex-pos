"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import type { BillItem, LocalBill, LocalPayment } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toMoney } from "@/lib/format"
import {
  Search, ShoppingCart, Trash2, Plus, Minus, Download, Upload, LogOut,
  DollarSign, LayoutGrid, Store, Save, ArrowLeft, Banknote, CreditCard, QrCode,
} from "lucide-react"

type SaleMode = "menu" | "tables"

export default function PosSalePage() {
  const router = useRouter()
  const {
    isPaired, posUser, cashSession, syncData, deviceName,
    addPendingSale, posLogout, openBills, saveOpenBill, payOpenBill, loadOpenBills,
  } = usePosStore()
  const { alertError, confirm, toastSuccess } = useAlertStore()

  const [saleMode, setSaleMode] = useState<SaleMode>("menu")
  const [searchMenu, setSearchMenu] = useState("")
  const [selectedGroupSid, setSelectedGroupSid] = useState<string | null>(null)
  const [billItems, setBillItems] = useState<BillItem[]>([])

  // Ширээ захиалгын state
  const [selectedRoomSid, setSelectedRoomSid] = useState<string | null>(null)
  const [currentTableSid, setCurrentTableSid] = useState<string | null>(null)
  const [currentTableName, setCurrentTableName] = useState("")
  const [currentBillId, setCurrentBillId] = useState<string | null>(null)

  // Төлбөрийн dialog
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentType, setPaymentType] = useState(1) // 1=cash
  const [paymentAmount, setPaymentAmount] = useState("")

  useEffect(() => {
    if (!isPaired || !posUser) { router.replace("/login"); return }
    if (!cashSession) { router.replace("/cash"); return }
    loadOpenBills()
  }, [isPaired, posUser, cashSession, router, loadOpenBills])

  // Эхний room автомат сонгох
  useEffect(() => {
    if (saleMode === "tables" && !selectedRoomSid && syncData.rooms.length > 0) {
      setSelectedRoomSid(syncData.rooms[0].sid)
    }
  }, [saleMode, selectedRoomSid, syncData.rooms])

  const billTotal = billItems.reduce((sum, item) => sum + item.amount, 0)

  // ═══ Menu functions ═══

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
      setBillItems(prev => [...prev, {
        menuSid: menu.sid, code: menu.code, name: menu.name,
        price, quantity: 1, amount: price,
      }])
    }
  }

  const updateQuantity = (menuSid: string, newQty: number) => {
    if (newQty <= 0) {
      setBillItems(prev => prev.filter(item => item.menuSid !== menuSid))
    } else {
      setBillItems(prev => prev.map(item =>
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
      setCurrentTableSid(null)
      setCurrentTableName("")
      setCurrentBillId(null)
    }
  }

  // ═══ Ширээ functions ═══

  const filteredTables = syncData.tables.filter((t: any) =>
    !selectedRoomSid || t.roomSid === selectedRoomSid
  )

  const getTableBill = useCallback((tableSid: string) => {
    return openBills.find(b => b.tableSid === tableSid && !b.isPaid)
  }, [openBills])

  const handleTableClick = (table: any) => {
    const existingBill = getTableBill(table.sid)
    if (existingBill) {
      // Завгүй ширээ — тооцоо ачаалах
      setBillItems([...existingBill.items])
      setCurrentBillId(existingBill.id)
    } else {
      // Чөлөөт ширээ — шинэ тооцоо
      setBillItems([])
      setCurrentBillId(null)
    }
    setCurrentTableSid(table.sid)
    setCurrentTableName(table.name)
    setSaleMode("menu")
  }

  const handleBackToTables = () => {
    setBillItems([])
    setCurrentTableSid(null)
    setCurrentTableName("")
    setCurrentBillId(null)
    setSaleMode("tables")
  }

  // ═══ Хадгалах (ширээний захиалга) ═══

  const handleSaveTableBill = () => {
    if (!currentTableSid || billItems.length === 0) return

    const billId = currentBillId || `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const bill: LocalBill = {
      id: billId,
      tableSid: currentTableSid,
      tableName: currentTableName,
      roomSid: selectedRoomSid,
      cashierSid: posUser?.sid || "",
      cashierName: posUser?.name || "",
      items: billItems,
      subtotal: billTotal,
      totalAmount: billTotal,
      isPaid: false,
      openDate: currentBillId
        ? (openBills.find(b => b.id === currentBillId)?.openDate || new Date().toISOString())
        : new Date().toISOString(),
      closedDate: null,
      payments: [],
      note: null,
    }
    saveOpenBill(bill)
    toastSuccess(`${currentTableName} — захиалга хадгалагдлаа`)
    handleBackToTables()
  }

  // ═══ Төлбөр ═══

  const openPaymentDialog = () => {
    if (billItems.length === 0) {
      alertError("Билл хоосон байна")
      return
    }
    setPaymentType(1)
    setPaymentAmount(billTotal.toString())
    setPaymentOpen(true)
  }

  const handlePay = () => {
    const amount = parseFloat(paymentAmount) || 0
    if (amount <= 0) {
      alertError("Төлбөрийн дүн оруулна уу")
      return
    }

    const payments: LocalPayment[] = [{ paymentType, amount }]

    if (currentTableSid && currentBillId) {
      // Ширээний тооцоо төлөх
      payOpenBill(currentBillId, payments)
      toastSuccess(`${currentTableName} — төлбөр амжилттай`)
      setPaymentOpen(false)
      handleBackToTables()
    } else {
      // Шууд борлуулалт
      const saleId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      addPendingSale({
        id: saleId,
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        tableSid: null,
        tableDinnerSid: null,
        cashierSid: posUser?.sid || "",
        items: billItems,
        payments,
        total: billTotal,
        uploaded: false,
      })
      toastSuccess("Борлуулалт амжилттай")
      setPaymentOpen(false)
      setBillItems([])
    }
  }

  const changeAmount = paymentType === 1 ? (parseFloat(paymentAmount) || 0) - billTotal : 0

  // ═══ Nav functions ═══

  const handleLogout = async () => {
    const confirmed = await confirm("Гарах", "Та системээс гарах уу?")
    if (confirmed) { posLogout(); router.replace("/login") }
  }

  const handleSwitchMode = (mode: SaleMode) => {
    if (mode === "tables" && currentTableSid) {
      handleBackToTables()
    } else {
      setBillItems([])
      setCurrentTableSid(null)
      setCurrentTableName("")
      setCurrentBillId(null)
      setSaleMode(mode)
    }
  }

  // ═══ Render ═══

  const showMenuPanel = saleMode === "menu"
  const isTableBill = !!currentTableSid

  return (
    <div className="flex h-full bg-background">
      {/* ═══ Left Panel ═══ */}
      <div className="flex-1 flex flex-col border-r">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{deviceName}</div>
              <div className="text-muted-foreground">{posUser?.name}</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={saleMode === "menu" && !isTableBill ? "default" : "outline"}
                onClick={() => handleSwitchMode("menu")}
              >
                <Store className="h-4 w-4 mr-2" />
                Шууд
              </Button>
              <Button
                variant={saleMode === "tables" || isTableBill ? "default" : "outline"}
                onClick={() => handleSwitchMode("tables")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Ширээ
              </Button>
              <Separator orientation="vertical" className="h-9" />
              <Button variant="outline" onClick={() => router.push("/sync")}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/upload")}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showMenuPanel && (
            <>
              {/* Ширээ-с буцах + хайлт */}
              <div className="flex gap-2">
                {isTableBill && (
                  <Button variant="outline" onClick={handleBackToTables}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Цэс хайх..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
            </>
          )}

          {saleMode === "tables" && !isTableBill && (
            <div className="flex gap-2 overflow-x-auto pb-1 slim-scroll">
              {syncData.rooms.map((room: any) => (
                <Button
                  key={room.sid}
                  variant={selectedRoomSid === room.sid ? "default" : "outline"}
                  onClick={() => setSelectedRoomSid(room.sid)}
                >
                  {room.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showMenuPanel ? (
            /* ═══ Menu Grid ═══ */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
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
          ) : (
            /* ═══ Table Grid ═══ */
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
              {filteredTables.map((table: any) => {
                const bill = getTableBill(table.sid)
                const isOccupied = !!bill
                return (
                  <Card
                    key={table.sid}
                    className={`p-4 cursor-pointer transition-colors text-center ${
                      isOccupied
                        ? "border-primary bg-primary/10 hover:bg-primary/20"
                        : "hover:border-primary"
                    }`}
                    onClick={() => handleTableClick(table)}
                  >
                    <div className="font-medium">{table.name}</div>
                    {isOccupied ? (
                      <div className="text-sm text-primary font-medium mt-1">
                        {toMoney(bill.totalAmount)}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">Чөлөөтэй</div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Right Panel: Bill ═══ */}
      <div className="w-96 flex flex-col border-l bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <div>
                <h2 className="font-bold">Билл</h2>
                {isTableBill && (
                  <span className="text-xs text-primary">{currentTableName}</span>
                )}
              </div>
            </div>
            {billItems.length > 0 && (
              <Button variant="outline" onClick={clearBill}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

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
                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuSid, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuSid, item.quantity + 1)}>
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
            {isTableBill && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSaveTableBill}
                disabled={billItems.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Хадгалах
              </Button>
            )}
            <Button
              className="w-full"
              onClick={openPaymentDialog}
              disabled={billItems.length === 0}
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Төлөлт хийх
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/cash")}>
              Касс хаах
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Payment Dialog ═══ */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Төлбөр хийх</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Нийт дүн</div>
              <div className="text-3xl font-bold">{toMoney(billTotal)}</div>
            </div>

            <Separator />

            {/* Төлбөрийн төрөл */}
            <div className="flex gap-2">
              <Button
                variant={paymentType === 1 ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentType(1)}
              >
                <Banknote className="h-4 w-4 mr-2" />
                Бэлэн
              </Button>
              <Button
                variant={paymentType === 2 ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentType(2)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Карт
              </Button>
              <Button
                variant={paymentType === 4 ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentType(4)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR
              </Button>
            </div>

            {/* Дүн оруулах */}
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Дүн"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="text-center text-lg"
              />
              {paymentType === 1 && changeAmount > 0 && (
                <div className="text-center text-sm">
                  Хариулт: <span className="font-bold text-primary">{toMoney(changeAmount)}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={handlePay}>
              <DollarSign className="h-4 w-4 mr-2" />
              Төлөх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
