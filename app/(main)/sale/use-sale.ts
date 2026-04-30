"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import type { BillItem, LocalBill, LocalPayment, PendingSale, ChipAssignment } from "@/lib/store"
import { toMoney, dateToStr, today } from "@/lib/format"

export type SaleMode = "menu" | "tables" | "bills" | "jetons"

export function useSale() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    isPaired, posUser, cashSession, syncData, deviceName, pendingSales,
    addPendingSale, posLogout, openBills, saveOpenBill, payOpenBill,
  } = usePosStore()
  const { alertError, confirm, toastSuccess } = useAlertStore()

  // SSR hydration mismatch-аас сэргийлж эхэндээ "tables" гэж тогтооно.
  // URL-аас mode-ыг доорх useEffect-р mount-ын дараа sync хийнэ.
  const [saleMode, setSaleMode] = useState<SaleMode>("tables")

  const [searchMenu, setSearchMenu] = useState("")
  const [selectedGroupSid, setSelectedGroupSid] = useState<string | null>(null)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [billChips, setBillChips] = useState<ChipAssignment[]>([])

  // Ширээ захиалгын state
  const [selectedRoomSid, setSelectedRoomSid] = useState<string | null>(null)
  const [currentTableSid, setCurrentTableSid] = useState<string | null>(null)
  const [currentTableName, setCurrentTableName] = useState("")
  const [currentBillId, setCurrentBillId] = useState<string | null>(null)

  useEffect(() => {
    const m = searchParams?.get("mode")
    const next = m === "bills" || m === "jetons" || m === "menu" ? (m as SaleMode) : "tables"
    setSaleMode(next)
    // Header navigation-аар (URL өөрчлөгдөхөд) ширээний идэвхтэй захиалгаас гарна,
    // эс тэгвээс currentTableSid үлдэж isTableBill үргэлж true → room list нуугддаг.
    if (next !== "menu") {
      setBillItems([])
      setCurrentTableSid(null)
      setCurrentTableName("")
      setCurrentBillId(null)
    }
  }, [searchParams])

  // Тооцооны хуудас state
  const [searchBills, setSearchBills] = useState("")
  const [billsFilter, setBillsFilter] = useState<"all" | "unsent" | "sent">("all")
  const [billsDate, setBillsDate] = useState<string>(() => today())

  // Билл preview dialog
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false)
  const [printPreviewEBarimt, setPrintPreviewEBarimt] = useState(false)

  // Төлбөрийн dialog
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentTypeSid, setPaymentTypeSid] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentList, setPaymentList] = useState<LocalPayment[]>([])

  // Бүжигчин сонгох dialog
  const [dancerPickerOpen, setDancerPickerOpen] = useState(false)
  const [pendingMenu, setPendingMenu] = useState<any | null>(null)
  const [dancerChangeItemSid, setDancerChangeItemSid] = useState<string | null>(null)


  // Жетон хуваарилах dialog
  const [chipOpen, setChipOpen] = useState(false)
  const [chipListOpen, setChipListOpen] = useState(false)

  // Auth redirect
  useEffect(() => {
    if (!isPaired || !posUser) { router.replace("/login"); return }
    if (!cashSession) { router.replace("/cash"); return }
  }, [isPaired, posUser, cashSession, router])

  // posUser өөрчлөгдөх бүрт өгөгдөл restore хийх
  useEffect(() => {
    if (!posUser) return
    usePosStore.getState().loadOpenBills()
    const { syncData: sd } = usePosStore.getState()
    if (sd.menus.length === 0 || sd.rooms.length === 0) {
      try {
        const syncSaved = localStorage.getItem('sync-data')
        if (syncSaved) {
          usePosStore.setState({ syncData: JSON.parse(syncSaved) })
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posUser?.sid])

  // Эхний room автомат сонгох
  useEffect(() => {
    if ((saleMode === "tables" || saleMode === "menu") && !selectedRoomSid && syncData.rooms.length > 0) {
      setSelectedRoomSid(syncData.rooms[0].sid)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleMode, syncData.rooms.length])

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

  const autoSaveTableBill = (items: BillItem[]) => {
    if (!currentTableSid || items.length === 0) return
    const billId = currentBillId || `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    if (!currentBillId) setCurrentBillId(billId)
    const total = items.reduce((sum, item) => item.isCancelled ? sum : sum + item.amount, 0)
    const bill: LocalBill = {
      id: billId,
      tableSid: currentTableSid,
      tableName: currentTableName,
      roomSid: selectedRoomSid,
      cashierSid: posUser?.sid || "",
      cashierName: posUser?.name || "",
      items,
      subtotal: total,
      totalAmount: total,
      isPaid: false,
      openDate: currentBillId
        ? (openBills.find(b => b.id === currentBillId)?.openDate || new Date().toISOString())
        : new Date().toISOString(),
      closedDate: null,
      payments: [],
      note: null,
    }
    saveOpenBill(bill)
  }

  const addMenuItem = (menu: any) => {
    // Төлбөртэй үйлчилгээ (бүжигчинтэй холбоотой) бол өөр бүжигчинтэй нэмэх шаардлагатай.
    // POS дээр isDancerEnabled=1 үед л бүжигчин сонгох dialog нээнэ
    const isPaid = !!(menu.isPaidService ?? menu.is_paid_service)
    if (isPaid && syncData.isDancerEnabled === 1) {
      setPendingMenu(menu)
      setDancerChangeItemSid(null)
      setDancerPickerOpen(true)
      return
    }

    const existing = billItems.find(item => item.menuSid === menu.sid)
    let newItems: BillItem[]
    if (existing) {
      if (existing.isCancelled) {
        newItems = billItems.map(item =>
          item.menuSid === menu.sid
            ? { ...item, isCancelled: false, quantity: 1, amount: item.price }
            : item
        )
      } else {
        const newQty = existing.quantity + 1
        newItems = billItems.map(item =>
          item.menuSid === menu.sid
            ? { ...item, quantity: newQty, amount: item.price * newQty, isCancelled: false }
            : item
        )
      }
    } else {
      const price = menu.price || 0
      newItems = [...billItems, {
        menuSid: menu.sid, code: menu.code, name: menu.name,
        price, quantity: 1, amount: price,
      }]
    }
    setBillItems(newItems)
    if (currentTableSid) autoSaveTableBill(newItems)
  }

  const openDancerChange = (itemSid: string) => {
    setPendingMenu(null)
    setDancerChangeItemSid(itemSid)
    setDancerPickerOpen(true)
  }

  const selectDancer = (dancer: any) => {
    const percent = Number(pendingMenu?.employeePercent ?? pendingMenu?.employee_percent ?? 0) || 0

    // Байгаа bill item-ийн бүжигчнийг солих
    if (dancerChangeItemSid) {
      const newItems = billItems.map(it =>
        it.menuSid === dancerChangeItemSid
          ? {
              ...it,
              dancerSid: dancer.sid,
              dancerName: dancer.nickname || dancer.name,
            }
          : it
      )
      setBillItems(newItems)
      if (currentTableSid) autoSaveTableBill(newItems)
      setDancerChangeItemSid(null)
      return
    }

    // Шинэ төлбөртэй үйлчилгээ нэмэх — бүжигчин тус бүрт өөр мөр гэж үзнэ
    if (!pendingMenu) return
    const menu = pendingMenu
    const price = menu.price || 0
    const lineId = `${menu.sid}__${dancer.sid}`
    const existing = billItems.find(item => item.menuSid === lineId)
    let newItems: BillItem[]
    if (existing && !existing.isCancelled) {
      const newQty = existing.quantity + 1
      newItems = billItems.map(item =>
        item.menuSid === lineId
          ? {
              ...item,
              quantity: newQty,
              amount: item.price * newQty,
              employeeAmount: (item.price * newQty) * (percent / 100),
            }
          : item
      )
    } else {
      newItems = [...billItems, {
        menuSid: lineId, code: menu.code, name: menu.name,
        price, quantity: 1, amount: price,
        isPaidService: true,
        employeePercent: percent,
        employeeAmount: price * (percent / 100),
        dancerSid: dancer.sid,
        dancerName: dancer.nickname || dancer.name,
      }]
    }
    setBillItems(newItems)
    if (currentTableSid) autoSaveTableBill(newItems)
    setPendingMenu(null)
  }

  const updateQuantity = (menuSid: string, newQty: number) => {
    let newItems: BillItem[]
    if (newQty <= 0) {
      newItems = billItems.map(item =>
        item.menuSid === menuSid
          ? { ...item, isCancelled: true, quantity: 0, amount: 0 }
          : item
      )
    } else {
      newItems = billItems.map(item =>
        item.menuSid === menuSid
          ? { ...item, quantity: newQty, amount: item.price * newQty, isCancelled: false }
          : item
      )
    }
    setBillItems(newItems)
    if (currentTableSid) autoSaveTableBill(newItems)
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

  const addChip = (dancer: { sid: string; name?: string; nickname?: string }, quantity: number, price: number, description?: string) => {
    if (!dancer?.sid || !(quantity > 0) || !(price > 0)) return
    const chip: ChipAssignment = {
      id: `chip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dancerSid: dancer.sid,
      dancerName: dancer.nickname || dancer.name || '',
      quantity,
      price,
      total: quantity * price,
      description,
      createdAt: new Date().toISOString(),
    }
    setBillChips((prev) => [...prev, chip])
  }

  const removeChip = (id: string) => {
    setBillChips((prev) => prev.filter((c) => c.id !== id))
  }

  const savePendingChips = () => {
    if (billChips.length === 0) return
    const chipTotal = billChips.reduce((s, c) => s + c.total, 0)
    const saleId = `chipsale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    addPendingSale({
      id: saleId,
      createdAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      tableSid: null,
      tableDinnerSid: null,
      cashierSid: posUser?.sid || "",
      items: [],
      chips: billChips,
      payments: [],
      total: chipTotal,
      uploaded: false,
    })
    toastSuccess(`Жетон хадгалагдлаа — ${toMoney(chipTotal)}`)
    setBillChips([])
    setChipOpen(false)
  }

  // Нэг алхамаар жетон бүртгэх (modal-аас дуудах) — staging-аар дамжихгүй
  const saveSingleChip = (
    dancer: { sid: string; name?: string; nickname?: string },
    quantity: number,
    price: number,
    description?: string,
  ) => {
    if (!dancer?.sid || !(quantity > 0) || !(price > 0)) return false
    const chip: ChipAssignment = {
      id: `chip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dancerSid: dancer.sid,
      dancerName: dancer.nickname || dancer.name || '',
      quantity,
      price,
      total: quantity * price,
      description,
      createdAt: new Date().toISOString(),
    }
    const saleId = `chipsale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    addPendingSale({
      id: saleId,
      createdAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      tableSid: null,
      tableDinnerSid: null,
      cashierSid: posUser?.sid || "",
      items: [],
      chips: [chip],
      payments: [],
      total: chip.total,
      uploaded: false,
    })
    toastSuccess(`Жетон хадгалагдлаа — ${toMoney(chip.total)}`)
    return true
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

  const doPayment = (payments: LocalPayment[]) => {
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

  const handlePay = () => {
    const payments = paymentList.length > 0
      ? paymentList
      : paymentTypeSid
        ? [{ paymentType: paymentTypeSid, amount: parseFloat(paymentAmount) || 0 }]
        : []
    doPayment(payments)
  }

  const getPaymentTypeName = (sid: string) => syncData.paymentTypes.find((pt: any) => pt.sid === sid)?.name || ''

  // ═══ Билл хэвлэх ═══

  const printBill = (withEBarimt: boolean) => {
    if (billItems.length === 0) {
      alertError("Билл хоосон байна")
      return
    }
    setPrintPreviewEBarimt(withEBarimt)
    setPrintPreviewOpen(true)
  }

  const isTableBill = !!currentTableSid

  const buildReceiptHtml = (opts: {
    items: BillItem[]
    total: number
    dateStr: string
    tableName?: string
    cashierName?: string
    ebarimt?: boolean
  }) => {
    const { items, total, dateStr, tableName, cashierName, ebarimt } = opts
    return `<html>
<head>
<title>Билл</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: monospace; font-size: 12px; width: 48mm; margin: 0 auto; padding: 2mm 0; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; }
  .items { margin: 4px 0; }
  .total { font-size: 13px; font-weight: bold; }
  @media print {
    html, body { width: 48mm; }
    @page { size: 58mm auto; margin: 0; }
  }
</style>
</head>
<body>
  <div class="center bold" style="font-size:13px">${deviceName}</div>
  <div class="center">${dateStr}</div>
  ${tableName ? `<div class="center bold">${tableName}</div>` : ''}
  ${cashierName ? `<div class="center">Кассчин: ${cashierName}</div>` : ''}
  <div class="line"></div>
  <div class="items">
    ${items.map((item, i) => {
      const anyItem = item as any
      const dancerName: string | undefined = anyItem.dancerName
      return `
      <div class="row">
        <span>${i + 1}. ${item.name}</span>
      </div>
      ${dancerName ? `<div class="row" style="padding-left:12px;font-style:italic">
        <span>⇢ ${dancerName}</span>
      </div>` : ''}
      <div class="row" style="padding-left:12px">
        <span>${toMoney(item.price)} x ${item.quantity}</span>
        <span>${toMoney(item.amount)}</span>
      </div>
    `}).join('')}
  </div>
  <div class="line"></div>
  <div class="row total">
    <span>НИЙТ:</span>
    <span>${toMoney(total)}</span>
  </div>
  ${ebarimt === true ? `
    <div class="line"></div>
    <div class="center" style="margin-top:4px">
      <div class="bold">Е-БАРИМТ</div>
      <div style="font-size:10px;margin-top:2px">ДДТД: ${Date.now()}</div>
      <div style="font-size:10px">Огноо: ${dateStr}</div>
    </div>
  ` : ebarimt === false ? `
    <div class="line"></div>
    <div class="center" style="margin-top:2px;font-size:10px">Е-баримтгүй</div>
  ` : ''}
  <div class="center" style="margin-top:4px;font-size:10px">Баярлалаа!</div>
  <div style="margin-bottom:8mm"></div>
</body>
</html>`
  }

  const printReceipt = (html: string) => {
    const printWindow = window.open('', '_blank', 'width=240,height=600')
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    // print() дараа шууд close хийхгүй — onafterprint-аар хүлээнэ
    printWindow.onafterprint = () => printWindow.close()
    setTimeout(() => printWindow.print(), 100)
    // Хэрэв onafterprint асуумжаар триггер болохгүй бол 30 сек дараа хаах
    setTimeout(() => { try { printWindow.close() } catch {} }, 30000)
  }

  const printReceiptDirect = async (input: import("@/lib/escpos").ReceiptInput, htmlFallback: string) => {
    const escpos = await import("@/lib/escpos")
    if (!escpos.isTauri()) {
      // Browser fallback
      printReceipt(htmlFallback)
      return
    }
    const result = await escpos.printReceipt(input)
    if (!result.ok) {
      // Таурид алдаа гарвал HTML print-р fallback
      console.error("[PRINT] ESC/POS алдаа:", result.error)
      alertError("Принтерт хэвлэхэд алдаа гарлаа", result.error + "\n\nХөтчийн print диалог нээгдэнэ.")
      printReceipt(htmlFallback)
    }
  }

  const doPrintBill = async () => {
    const activeItems = billItems.filter(i => !i.isCancelled)
    const dateStr = new Date().toLocaleString("mn-MN")
    const html = buildReceiptHtml({
      items: activeItems,
      total: billTotal,
      dateStr,
      tableName: isTableBill ? currentTableName : undefined,
      cashierName: posUser?.name,
      ebarimt: printPreviewEBarimt,
    })
    await printReceiptDirect({
      storeName: deviceName || "Finex POS",
      dateStr,
      tableName: isTableBill ? currentTableName : undefined,
      cashierName: posUser?.name,
      items: activeItems.map((it: any) => ({
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        amount: it.amount,
        dancerName: it.dancerName,
      })),
      total: billTotal,
      ebarimt: printPreviewEBarimt,
    }, html)
    setPrintPreviewOpen(false)
  }

  const handleDeleteSale = async (saleId: string) => {
    const confirmed = await confirm("Тооцоо устгах", "Энэ тооцоог устгах уу?")
    if (!confirmed) return

    const updated = pendingSales.map(s =>
      s.id === saleId ? { ...s, isDeleted: true } : s
    )
    usePosStore.setState({ pendingSales: updated })
    localStorage.setItem('pending-sales', JSON.stringify(updated))
    toastSuccess("Тооцоо устгагдлаа")
  }

  const printClosedBill = async (sale: PendingSale) => {
    const activeItems = sale.items.filter((i: any) => !i.isCancelled)
    const dateStr = new Date(sale.createdAt).toLocaleString("mn-MN")
    const html = buildReceiptHtml({
      items: activeItems,
      total: sale.total,
      dateStr,
    })
    await printReceiptDirect({
      storeName: deviceName || "Finex POS",
      dateStr,
      items: activeItems.map((it: any) => ({
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        amount: it.amount,
        dancerName: it.dancerName,
      })),
      total: sale.total,
    }, html)
  }

  // ═══ Nav functions ═══

  const handleLogout = async () => {
    const unsent = pendingSales.filter((s: any) => !s.uploaded && !s.isDeleted).length
    if (unsent > 0) {
      const { alertError } = useAlertStore.getState()
      alertError("Илгээгээгүй мэдээлэл байна", `${unsent} борлуулалт серверт илгээгдээгүй байна. Эхлээд "Илгээх" дэлгэцээр илгээнэ үү.`)
      return
    }
    const confirmed = await confirm("Гарах", "Та системээс гарах уу?")
    if (confirmed) { posLogout(); router.replace("/login") }
  }

  const handleSwitchMode = (mode: SaleMode) => {
    if (mode === "tables" && currentTableSid) {
      handleBackToTables()
    } else if (mode === "bills" || mode === "jetons") {
      setBillItems([])
      setCurrentTableSid(null)
      setCurrentTableName("")
      setCurrentBillId(null)
      setSaleMode(mode)
    } else {
      setBillItems([])
      setCurrentTableSid(null)
      setCurrentTableName("")
      setCurrentBillId(null)
      setSaleMode(mode)
    }
  }

  const dateFilteredBills = useMemo(() =>
    pendingSales.filter((sale) => {
      if (sale.isDeleted) return false
      if (!billsDate) return true
      // POS-н ажиллаж буй өдрөөр шүүнэ. docDate байхгүй хуучин бичлэгүүдэд createdAt-ыг fallback болгоно.
      const d = sale.docDate || dateToStr(sale.createdAt)
      return d === billsDate
    }),
    [pendingSales, billsDate]
  )

  const filteredBills = useMemo(() =>
    dateFilteredBills.filter((sale) => {
      if (billsFilter === "unsent" && sale.uploaded) return false
      if (billsFilter === "sent" && !sale.uploaded) return false
      if (!searchBills) return true
      const lower = searchBills.toLowerCase()
      return (
        sale.id.toLowerCase().includes(lower) ||
        sale.items.some((item: any) => item.name?.toLowerCase().includes(lower))
      )
    }),
    [dateFilteredBills, searchBills, billsFilter]
  )

  const billsCounts = useMemo(() => {
    let unsent = 0, sent = 0
    dateFilteredBills.forEach((s: any) => {
      if (s.uploaded) sent++
      else unsent++
    })
    return { all: unsent + sent, unsent, sent }
  }, [dateFilteredBills])

  const showMenuPanel = saleMode === "menu"
  const showBillsPanel = saleMode === "bills"
  const showJetonsPanel = saleMode === "jetons"

  return {
    // Store data
    posUser, syncData, deviceName, pendingSales,

    // Mode
    saleMode, showMenuPanel, showBillsPanel, showJetonsPanel, isTableBill,

    // Menu
    searchMenu, setSearchMenu,
    selectedGroupSid, setSelectedGroupSid,
    filteredMenus, addMenuItem,

    // Bill
    billItems, setBillItems, billTotal, billItemCount,
    updateQuantity, clearBill,

    // Tables
    selectedRoomSid, setSelectedRoomSid,
    currentTableSid, currentTableName, currentBillId,
    filteredTables, getTableBill,
    handleTableClick, handleBackToTables, handleSaveTableBill,

    // Bills list
    searchBills, setSearchBills,
    billsDate, setBillsDate,
    filteredBills, billsFilter, setBillsFilter, billsCounts,
    handleDeleteSale, printClosedBill,

    // Payment
    paymentOpen, setPaymentOpen,
    paymentTypeSid, setPaymentTypeSid,
    paymentAmount, setPaymentAmount,
    paymentList, paidTotal, remainingAmount, selectedPt,
    openPaymentDialog, handleAddPayment, handleRemovePayment, handlePay,
    getPaymentTypeName,

    // Print
    printPreviewOpen, setPrintPreviewOpen,
    printPreviewEBarimt, printBill, doPrintBill,

    // Dancer
    dancerPickerOpen, setDancerPickerOpen,
    selectDancer, openDancerChange,

    // Chip (жетон) — билл/төлбөрөөс хамааралгүй
    chipOpen, setChipOpen, billChips, addChip, removeChip, savePendingChips, saveSingleChip,
    chipListOpen, setChipListOpen,

    // Nav
    handleSwitchMode, handleLogout, router,
  }
}

export type UseSaleReturn = ReturnType<typeof useSale>
