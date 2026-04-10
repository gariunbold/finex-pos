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
  Coffee, Users, BarChart3, Building2, Wallet, CircleDollarSign,
} from "lucide-react"

const TugrikIcon = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontWeight: 700, fontSize: '1.1em', lineHeight: 1 }}>₮</span>
)

function getPaymentIcon(codeOrName: string) {
  const lower = (codeOrName || '').toLowerCase()
  if (lower.includes('cash') || lower.includes('бэлэн')) return Banknote
  if (lower.includes('card') || lower.includes('карт')) return CreditCard
  if (lower.includes('qr') || lower.includes('qpay')) return QrCode
  if (lower.includes('bank') || lower.includes('данс')) return Building2
  if (lower.includes('credit') || lower.includes('зээл')) return Wallet
  return TugrikIcon
}

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
  const [paymentTypeSid, setPaymentTypeSid] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentList, setPaymentList] = useState<LocalPayment[]>([]) // олон төлбөр

  useEffect(() => {
    if (!isPaired || !posUser) { router.replace("/login"); return }
    if (!cashSession) { router.replace("/cash"); return }
    loadOpenBills()
    // syncData хоосон бол restore хийх
    if (syncData.menus.length === 0) {
      usePosStore.getState().restorePosSession()
    }
  }, [isPaired, posUser, cashSession, router, loadOpenBills, syncData.menus.length])

  // Эхний room автомат сонгох
  useEffect(() => {
    if (saleMode === "tables" && !selectedRoomSid && syncData.rooms.length > 0) {
      setSelectedRoomSid(syncData.rooms[0].sid)
    }
  }, [saleMode, selectedRoomSid, syncData.rooms])

  const billTotal = billItems.reduce((sum, item) => item.isCancelled ? sum : sum + item.amount, 0)
  const billItemCount = billItems.reduce((sum, item) => item.isCancelled ? sum : sum + item.quantity, 0)

  // ═══ Menu functions ═══

  const filteredMenus = syncData.menus.filter((menu: any) => {
    const matchesSearch = !searchMenu ||
      menu.code?.toLowerCase().includes(searchMenu.toLowerCase()) ||
      menu.name?.toLowerCase().includes(searchMenu.toLowerCase())
    const menuGroupSid = menu.groupSid || menu.group_sid
    const matchesGroup = !selectedGroupSid || menuGroupSid === selectedGroupSid
    const isActive = menu.isActive ?? menu.is_active
    return matchesSearch && matchesGroup && isActive !== 0
  })

  const addMenuItem = (menu: any) => {
    const existing = billItems.find(item => item.menuSid === menu.sid)
    if (existing) {
      if (existing.isCancelled) {
        // Цуцлагдсан барааг сэргээх
        setBillItems(prev => prev.map(item =>
          item.menuSid === menu.sid
            ? { ...item, isCancelled: false, quantity: 1, amount: item.price }
            : item
        ))
      } else {
        updateQuantity(menu.sid, existing.quantity + 1)
      }
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
      // Soft delete — quantity/amount 0 болгож, flag тавина
      setBillItems(prev => prev.map(item =>
        item.menuSid === menuSid
          ? { ...item, isCancelled: true, quantity: 0, amount: 0 }
          : item
      ))
    } else {
      setBillItems(prev => prev.map(item =>
        item.menuSid === menuSid
          ? { ...item, quantity: newQty, amount: item.price * newQty, isCancelled: false }
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
      setBillItems([...existingBill.items])
      setCurrentBillId(existingBill.id)
    } else {
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

  const selectedPt = syncData.paymentTypes.find((pt: any) => pt.sid === paymentTypeSid)
  const paidTotal = paymentList.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = billTotal - paidTotal

  const openPaymentDialog = () => {
    if (billItems.length === 0) {
      alertError("Билл хоосон байна")
      return
    }
    setPaymentTypeSid(syncData.paymentTypes[0]?.sid || null)
    setPaymentAmount(billTotal.toString())
    setPaymentList([])
    setPaymentOpen(true)
  }

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount) || 0
    if (amount <= 0) {
      alertError("Дүн оруулна уу")
      return
    }
    if (!paymentTypeSid) {
      alertError("Төлбөрийн төрөл сонгоно уу")
      return
    }
    const newList = [...paymentList, { paymentType: paymentTypeSid, amount }]
    setPaymentList(newList)

    const newRemaining = billTotal - newList.reduce((sum, p) => sum + p.amount, 0)
    if (newRemaining > 0) {
      setPaymentAmount(newRemaining.toString())
    } else {
      setPaymentAmount("0")
    }
  }

  const handleRemovePayment = (index: number) => {
    const newList = paymentList.filter((_, i) => i !== index)
    setPaymentList(newList)
    const newRemaining = billTotal - newList.reduce((sum, p) => sum + p.amount, 0)
    setPaymentAmount(newRemaining > 0 ? newRemaining.toString() : "0")
  }

  const handlePay = () => {
    const payments = paymentList.length > 0
      ? paymentList
      : paymentTypeSid
        ? [{ paymentType: paymentTypeSid, amount: parseFloat(paymentAmount) || 0 }]
        : []

    if (payments.length === 0 || payments.some(p => !p.paymentType || p.amount <= 0)) {
      alertError("Төлбөр нэмнэ үү")
      return
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid < billTotal) {
      alertError("Төлбөрийн дүн хүрэхгүй байна", `Үлдэгдэл: ${toMoney(billTotal - totalPaid)}`)
      return
    }

    if (currentTableSid && currentBillId) {
      payOpenBill(currentBillId, payments)
      toastSuccess(`${currentTableName} — төлбөр амжилттай`)
      setPaymentOpen(false)
      handleBackToTables()
    } else {
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

  const getPaymentTypeName = (sid: string) => syncData.paymentTypes.find((pt: any) => pt.sid === sid)?.name || ''

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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Coffee className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">{deviceName}</div>
                <div className="text-sm text-muted-foreground leading-tight">{posUser?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                <Button
                  variant={saleMode === "menu" && !isTableBill ? "default" : "outline"}
                  className={saleMode === "menu" && !isTableBill ? "" : "border-0 bg-transparent hover:bg-background"}
                  onClick={() => handleSwitchMode("menu")}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Шууд
                </Button>
                <Button
                  variant={saleMode === "tables" || isTableBill ? "default" : "outline"}
                  className={saleMode === "tables" || isTableBill ? "" : "border-0 bg-transparent hover:bg-background"}
                  onClick={() => handleSwitchMode("tables")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Ширээ
                </Button>
              </div>
              <Separator orientation="vertical" className="h-7 mx-1" />
              <Button variant="outline" onClick={() => router.push("/report")}>
                <BarChart3 className="h-4 w-4" />
              </Button>
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
            <div className="px-4 pb-3 space-y-2.5">
              {/* Ширээ-с буцах + хайлт */}
              <div className="flex gap-2">
                {isTableBill && (
                  <Button variant="outline" onClick={handleBackToTables}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                {isTableBill && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{currentTableName}</span>
                  </div>
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

              {/* Menu groups - pill style */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 slim-scroll">
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
          )}

          {saleMode === "tables" && !isTableBill && (
            <div className="px-4 pb-3">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 slim-scroll">
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
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 slim-scroll bg-muted/30">
          {showMenuPanel ? (
            /* ═══ Menu Grid ═══ */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 content-start">
              {filteredMenus.map((menu: any) => {
                const inBill = billItems.find(item => item.menuSid === menu.sid && !item.isCancelled)
                return (
                  <Card
                    key={menu.sid}
                    className={`group relative overflow-visible p-3.5 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
                      inBill
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => addMenuItem(menu)}
                  >
                    {inBill && (
                      <div className="absolute -top-2.5 -right-2.5 flex h-7 min-w-7 px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md z-10">
                        {inBill.quantity}
                      </div>
                    )}
                    <div className="font-medium text-sm leading-snug">{menu.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{menu.code}</div>
                    <div className="text-sm font-semibold mt-2 text-primary">{toMoney(menu.price || 0)}</div>
                  </Card>
                )
              })}
              {filteredMenus.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Search className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">Цэс олдсонгүй</p>
                </div>
              )}
            </div>
          ) : (
            /* ═══ Table Grid ═══ */
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 content-start">
              {filteredTables.map((table: any) => {
                const bill = getTableBill(table.sid)
                const isOccupied = !!bill
                return (
                  <Card
                    key={table.sid}
                    className={`p-4 cursor-pointer transition-all text-center hover:shadow-md active:scale-[0.98] ${
                      isOccupied
                        ? "border-primary bg-primary/8 hover:bg-primary/12 shadow-sm"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => handleTableClick(table)}
                  >
                    <div className={`font-semibold ${isOccupied ? "text-primary" : ""}`}>
                      {table.name}
                    </div>
                    {isOccupied ? (
                      <div className="text-sm text-primary font-bold mt-1.5">
                        {toMoney(bill.totalAmount)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground mt-1.5">Чөлөөтэй</div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Right Panel: Bill ═══ */}
      <div className="w-[360px] flex flex-col border-l bg-card shadow-[-1px_0_3px_rgba(0,0,0,0.04)]">
        {/* Bill header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-sm leading-tight">Билл</h2>
                {isTableBill ? (
                  <span className="text-sm text-primary font-medium leading-tight">{currentTableName}</span>
                ) : (
                  <span className="text-sm text-muted-foreground leading-tight">
                    {billItemCount > 0 ? `${billItemCount} зүйл` : "Хоосон"}
                  </span>
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

        {/* Bill items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 slim-scroll">
          {billItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
                <ShoppingCart className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm">Билл хоосон байна</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Цэснээс зүйл сонгоно уу</p>
            </div>
          ) : (
            billItems.map((item, index) => (
              <div
                key={item.menuSid}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  item.isCancelled
                    ? "bg-destructive/5 opacity-50"
                    : "bg-muted/40 hover:bg-muted/60"
                }`}
              >
                {/* Item number */}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${
                  item.isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                }`}>
                  {index + 1}
                </div>
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm leading-tight truncate ${item.isCancelled ? "line-through text-muted-foreground" : ""}`}>
                    {item.name}
                  </div>
                  {item.isCancelled ? (
                    <div className="text-sm text-destructive">Цуцлагдсан</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">{toMoney(item.price)} x {item.quantity}</div>
                  )}
                </div>
                {item.isCancelled ? (
                  /* Сэргээх товч */
                  <Button
                    variant="outline"
                    className="h-7 px-2 text-sm"
                    onClick={() => setBillItems(prev => prev.map(i =>
                      i.menuSid === item.menuSid ? { ...i, isCancelled: false, quantity: 1, amount: i.price } : i
                    ))}
                  >
                    Сэргээх
                  </Button>
                ) : (
                  <>
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <Button variant="outline" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuSid, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button variant="outline" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuSid, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* Amount */}
                    <div className="text-sm font-semibold w-20 text-right">{toMoney(item.amount)}</div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-card">
          {/* Total */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Нийт дүн</span>
              <span className="text-2xl font-bold tracking-tight">{toMoney(billTotal)}</span>
            </div>
          </div>
          <Separator />
          {/* Actions */}
          <div className="p-3 space-y-2">
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
              className="w-full h-11 text-sm font-semibold"
              onClick={openPaymentDialog}
              disabled={billItems.length === 0}
            >
              <span className="text-lg font-bold mr-2">₮</span>
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
            {/* Нийт дүн + Үлдэгдэл */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center py-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-sm text-muted-foreground">Нийт дүн</div>
                <div className="text-2xl font-bold tracking-tight mt-1">{toMoney(billTotal)}</div>
              </div>
              <div className={`text-center py-3 rounded-xl border ${remainingAmount > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                <div className="text-sm text-muted-foreground">Үлдэгдэл</div>
                <div className={`text-2xl font-bold tracking-tight mt-1 ${remainingAmount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {toMoney(Math.max(remainingAmount, 0))}
                </div>
              </div>
            </div>

            {/* Нэмсэн төлбөрүүд */}
            {paymentList.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto slim-scroll">
                {paymentList.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-sm font-medium">{getPaymentTypeName(p.paymentType)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{toMoney(p.amount)}</span>
                      <button onClick={() => handleRemovePayment(i)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Төлбөрийн төрөл сонгох */}
            {remainingAmount > 0 && (
              <>
                <div className={`grid gap-2 ${syncData.paymentTypes.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {syncData.paymentTypes.map((pt: any) => {
                    const isSelected = paymentTypeSid === pt.sid
                    const Icon = getPaymentIcon(pt.code || pt.name)
                    return (
                      <button
                        key={pt.sid}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/8"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                        onClick={() => setPaymentTypeSid(pt.sid)}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{pt.name}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Банкны данс мэдээлэл */}
                {selectedPt?.accountNumber && (
                  <div className="text-center py-2 px-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="text-sm text-muted-foreground">{selectedPt.bankName || 'Данс'}</div>
                    <div className="text-sm font-semibold tracking-wide">{selectedPt.accountNumber}</div>
                  </div>
                )}

                {/* Дүн + Нэмэх */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Дүн"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="text-center text-lg font-medium flex-1"
                  />
                  <Button onClick={handleAddPayment} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" /> Нэмэх
                  </Button>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={handlePay} disabled={paidTotal < billTotal}>
              <span className="text-sm font-bold mr-1">₮</span>
              Төлөх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
