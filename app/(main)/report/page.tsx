"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePosStore } from "@/lib/store"
import type { PendingSale } from "@/lib/store"
import { toMoney, dateToStr, today } from "@/lib/format"
import { DatePicker } from "@/components/ui/date-picker"
import {
  BarChart3, Banknote, CreditCard, QrCode,
  Layers, Receipt, Users, ChevronRight, ChevronDown,
} from "lucide-react"

type Tab = "payment" | "menugroup" | "dancer"

function getPaymentLabel(sid: string, syncData: any): { label: string; icon: typeof Banknote } {
  if (sid === "__unrecorded__") return { label: "Тодорхойгүй", icon: Receipt }
  const pt = syncData.paymentTypes?.find((p: any) => p.sid === sid)
  if (!pt) return { label: sid, icon: Receipt }
  const lower = (pt.code || pt.name || "").toLowerCase()
  if (lower.includes("cash") || lower.includes("бэлэн")) return { label: pt.name, icon: Banknote }
  if (lower.includes("card") || lower.includes("карт")) return { label: pt.name, icon: CreditCard }
  if (lower.includes("qr") || lower.includes("qpay")) return { label: pt.name, icon: QrCode }
  return { label: pt.name, icon: Receipt }
}

export default function PosReportPage() {
  const router = useRouter()
  const { isPaired, posUser, pendingSales, syncData, openBills } = usePosStore()

  const [tab, setTab] = useState<Tab>("payment")
  const [reportDate, setReportDate] = useState<string>(() => today())

  useEffect(() => {
    if (!isPaired || !posUser) {
      router.replace("/login")
    }
  }, [isPaired, posUser, router])

  const allSales: PendingSale[] = useMemo(() => {
    const paidBills: PendingSale[] = openBills
      .filter(b => b.isPaid && !!b.closedDate)
      .map(b => ({
        id: b.id,
        createdAt: b.openDate,
        closedAt: b.closedDate || b.openDate,
        tableSid: b.tableSid,
        tableDinnerSid: null,
        cashierSid: b.cashierSid,
        items: b.items,
        payments: b.payments,
        total: b.totalAmount,
        uploaded: false,
      }))
    const completedPending = pendingSales.filter((s: any) => {
      if (s.isDeleted) return false
      const hasPayments = Array.isArray(s.payments) && s.payments.length > 0
      const hasChips = Array.isArray(s.chips) && s.chips.length > 0
      return hasPayments || hasChips
    })
    const all = [...completedPending, ...paidBills]
    if (!reportDate) return all
    return all.filter((s: any) => {
      const d = s.docDate || dateToStr(s.createdAt)
      return d === reportDate
    })
  }, [pendingSales, openBills, reportDate])

  const paymentSummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    let grandTotal = 0
    let paidTotal = 0

    // Жетон-онли борлуулалт (items хоосон, chips бөглөгдсөн) нь төлбөрийн тайланд
    // орох шаардлагагүй — бүжигчинд шууд орлого тул payment report-оос хасна.
    const billSales = allSales.filter((s: any) => {
      const itemsLen = s.items?.length || 0
      const chipsLen = s.chips?.length || 0
      return !(itemsLen === 0 && chipsLen > 0)
    })

    for (const sale of billSales) {
      grandTotal += sale.total || 0
      for (const p of (sale.payments || [])) {
        const existing = map.get(p.paymentType) || { count: 0, total: 0 }
        existing.count += 1
        existing.total += p.amount
        paidTotal += p.amount
        map.set(p.paymentType, existing)
      }
    }

    const items = Array.from(map.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.total - a.total)

    const unrecorded = grandTotal - paidTotal
    if (unrecorded > 0.005) {
      items.push({ type: "__unrecorded__", count: 0, total: unrecorded })
    }

    return { items, grandTotal, saleCount: billSales.length }
  }, [allSales])

  const dancerSummary = useMemo(() => {
    const map = new Map<string, {
      dancerSid: string
      dancerName: string
      billCount: number
      totalRevenue: number
      totalEmployee: number
      items: Map<string, { name: string; quantity: number; total: number; employeeAmount: number }>
    }>()
    let grandRevenue = 0
    let grandEmployee = 0

    for (const sale of allSales) {
      const seenInBill = new Set<string>()

      // Item-аас орох орлого (ажилчны хувь)
      for (const item of (sale.items || [])) {
        const anyItem = item as any
        const dancerSid = anyItem.dancerSid
        if (!dancerSid || item.isCancelled) continue
        const dancerName: string = anyItem.dancerName || "—"
        const employeeAmount = Number(anyItem.employeeAmount || 0)

        if (!map.has(dancerSid)) {
          map.set(dancerSid, {
            dancerSid, dancerName,
            billCount: 0,
            totalRevenue: 0,
            totalEmployee: 0,
            items: new Map(),
          })
        }
        const g = map.get(dancerSid)!
        if (!seenInBill.has(dancerSid)) {
          g.billCount += 1
          seenInBill.add(dancerSid)
        }
        g.totalRevenue += item.amount
        g.totalEmployee += employeeAmount
        grandRevenue += item.amount
        grandEmployee += employeeAmount

        const key = item.menuSid || item.name
        if (!g.items.has(key)) {
          g.items.set(key, { name: item.name, quantity: 0, total: 0, employeeAmount: 0 })
        }
        const it = g.items.get(key)!
        it.quantity += item.quantity
        it.total += item.amount
        it.employeeAmount += employeeAmount
      }

      // Жетон (chips) — бүхэлдээ бүжигчинд орлого болж очно
      for (const chip of ((sale as any).chips || [])) {
        const dancerSid: string | undefined = chip?.dancerSid
        if (!dancerSid) continue
        const dancerName: string = chip.dancerName || "—"
        const chipQty = Number(chip.quantity || 0)
        const chipTotal = Number(chip.total || 0)
        if (chipQty <= 0 || chipTotal <= 0) continue

        if (!map.has(dancerSid)) {
          map.set(dancerSid, {
            dancerSid, dancerName,
            billCount: 0,
            totalRevenue: 0,
            totalEmployee: 0,
            items: new Map(),
          })
        }
        const g = map.get(dancerSid)!
        if (!seenInBill.has(dancerSid)) {
          g.billCount += 1
          seenInBill.add(dancerSid)
        }
        g.totalRevenue += chipTotal
        g.totalEmployee += chipTotal
        grandRevenue += chipTotal
        grandEmployee += chipTotal

        const key = "__jeton__"
        if (!g.items.has(key)) {
          g.items.set(key, { name: "Жетон", quantity: 0, total: 0, employeeAmount: 0 })
        }
        const it = g.items.get(key)!
        it.quantity += chipQty
        it.total += chipTotal
        it.employeeAmount += chipTotal
      }
    }

    const rows = Array.from(map.values())
      .map(g => ({ ...g, items: Array.from(g.items.values()).sort((a, b) => b.total - a.total) }))
      .sort((a, b) => b.totalEmployee - a.totalEmployee)

    return { rows, grandRevenue, grandEmployee }
  }, [allSales])

  const menuGroupSummary = useMemo(() => {
    const menuToGroup = new Map<string, string>()
    for (const menu of syncData.menus) {
      menuToGroup.set(menu.sid, menu.groupSid || menu.group_sid)
    }

    const groupNames = new Map<string, string>()
    for (const g of syncData.menuGroups) {
      groupNames.set(g.sid, g.name)
    }

    const map = new Map<string, { name: string; itemCount: number; quantity: number; total: number; items: Map<string, { name: string; quantity: number; total: number }> }>()
    let grandTotal = 0

    for (const sale of allSales) {
      for (const item of (sale.items || [])) {
        const groupSid = menuToGroup.get(item.menuSid) || "unknown"
        const groupName = groupNames.get(groupSid) || "Бусад"

        if (!map.has(groupSid)) {
          map.set(groupSid, { name: groupName, itemCount: 0, quantity: 0, total: 0, items: new Map() })
        }
        const group = map.get(groupSid)!
        group.quantity += item.quantity
        group.total += item.amount
        group.itemCount += 1
        grandTotal += item.amount

        const menuKey = item.menuSid
        if (!group.items.has(menuKey)) {
          group.items.set(menuKey, { name: item.name, quantity: 0, total: 0 })
        }
        const menuData = group.items.get(menuKey)!
        menuData.quantity += item.quantity
        menuData.total += item.amount
      }
    }

    const groups = Array.from(map.values())
      .map(g => ({
        ...g,
        items: Array.from(g.items.values()).sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total)

    return { groups, grandTotal }
  }, [allSales, syncData.menus, syncData.menuGroups])

  const grandTotal = tab === "payment"
    ? paymentSummary.grandTotal
    : tab === "menugroup"
      ? menuGroupSummary.grandTotal
      : dancerSummary.grandEmployee

  const itemCount = tab === "payment"
    ? paymentSummary.items.length
    : tab === "menugroup"
      ? menuGroupSummary.groups.length
      : dancerSummary.rows.length

  return (
    <div className="h-full flex flex-col bg-card/85 backdrop-blur-xl">
      {/* Title */}
      <div className="px-5 py-3">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Тайлан
        </h1>
      </div>

      {/* Toolbar */}
      <div className="px-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker value={reportDate} onChange={setReportDate} />
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-0.5">
            <TabChip active={tab === "payment"} onClick={() => setTab("payment")} label="Төлбөр" icon={<Banknote className="h-4 w-4" />} />
            <TabChip active={tab === "menugroup"} onClick={() => setTab("menugroup")} label="Цэсний бүлэг" icon={<Layers className="h-4 w-4" />} />
            <TabChip active={tab === "dancer"} onClick={() => setTab("dancer")} label="Бүжигчин" icon={<Users className="h-4 w-4" />} />
          </div>
          <div className="ml-auto text-sm text-muted-foreground tabular">
            {itemCount} төрөл · <span className="font-semibold text-foreground">{toMoney(grandTotal)}</span> ₮
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto auto-scroll bg-muted/15">
        {tab === "payment" ? (
          <PaymentReport data={paymentSummary} syncData={syncData} />
        ) : tab === "menugroup" ? (
          <MenuGroupReport data={menuGroupSummary} />
        ) : (
          <DancerReport data={dancerSummary} />
        )}
      </div>
    </div>
  )
}

function TabChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-8 px-3 rounded-lg inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
        {icon}
      </div>
      <p className="text-sm">{label}</p>
    </div>
  )
}

function PaymentReport({ data, syncData }: { data: { items: { type: string; count: number; total: number }[]; grandTotal: number; saleCount: number }; syncData: any }) {
  if (data.saleCount === 0) {
    return <EmptyState icon={<Receipt className="h-7 w-7 opacity-40" />} label="Борлуулалт байхгүй байна" />
  }

  return (
    <table className="w-full text-sm bg-card">
      <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
        <tr className="border-b border-border text-muted-foreground">
          <th className="px-4 py-2.5 text-left font-medium w-12">#</th>
          <th className="px-3 py-2.5 text-left font-medium">Төлбөрийн төрөл</th>
          <th className="px-3 py-2.5 text-right font-medium w-24">Тооцоо</th>
          <th className="px-3 py-2.5 text-right font-medium w-40">Дүн</th>
          <th className="px-3 py-2.5 text-right font-medium w-20">%</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, idx) => {
          const cfg = getPaymentLabel(item.type, syncData)
          const Icon = cfg.icon
          const percent = data.grandTotal > 0 ? (item.total / data.grandTotal) * 100 : 0
          return (
            <tr key={item.type} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
              <td className="px-4 py-2.5 text-muted-foreground tabular">{idx + 1}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">{cfg.label}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{item.count}</td>
              <td className="px-3 py-2.5 text-right font-bold tabular">{toMoney(item.total)}</td>
              <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{percent.toFixed(1)}%</td>
            </tr>
          )
        })}
        <tr className="border-t-2 border-border bg-muted/40 font-bold">
          <td className="px-4 py-2.5"></td>
          <td className="px-3 py-2.5">Нийт</td>
          <td className="px-3 py-2.5 text-right tabular">{data.saleCount}</td>
          <td className="px-3 py-2.5 text-right tabular">{toMoney(data.grandTotal)}</td>
          <td className="px-3 py-2.5 text-right tabular">100%</td>
        </tr>
      </tbody>
    </table>
  )
}

function MenuGroupReport({ data }: { data: { groups: { name: string; quantity: number; total: number; items: { name: string; quantity: number; total: number }[] }[]; grandTotal: number } }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (data.groups.length === 0) {
    return <EmptyState icon={<Layers className="h-7 w-7 opacity-40" />} label="Борлуулалт байхгүй байна" />
  }

  return (
    <table className="w-full text-sm bg-card">
      <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
        <tr className="border-b border-border text-muted-foreground">
          <th className="px-4 py-2.5 text-left font-medium w-12">#</th>
          <th className="px-3 py-2.5 text-left font-medium w-10"></th>
          <th className="px-3 py-2.5 text-left font-medium">Бүлэг / Цэс</th>
          <th className="px-3 py-2.5 text-right font-medium w-20">Тоо</th>
          <th className="px-3 py-2.5 text-right font-medium w-40">Дүн</th>
          <th className="px-3 py-2.5 text-right font-medium w-20">%</th>
        </tr>
      </thead>
      <tbody>
        {data.groups.map((group, idx) => {
          const percent = data.grandTotal > 0 ? (group.total / data.grandTotal) * 100 : 0
          const isExpanded = expanded === group.name
          return (
            <ReportGroupRows
              key={group.name}
              idx={idx}
              isExpanded={isExpanded}
              onToggle={() => setExpanded(isExpanded ? null : group.name)}
              name={group.name}
              quantity={group.quantity}
              total={group.total}
              percent={percent}
              items={group.items}
              groupTotal={group.total}
            />
          )
        })}
        <tr className="border-t-2 border-border bg-muted/40 font-bold">
          <td className="px-4 py-2.5" colSpan={3}>Нийт</td>
          <td className="px-3 py-2.5 text-right tabular"></td>
          <td className="px-3 py-2.5 text-right tabular">{toMoney(data.grandTotal)}</td>
          <td className="px-3 py-2.5 text-right tabular">100%</td>
        </tr>
      </tbody>
    </table>
  )
}

function ReportGroupRows({
  idx, isExpanded, onToggle, name, quantity, total, percent, items, groupTotal,
}: {
  idx: number
  isExpanded: boolean
  onToggle: () => void
  name: string
  quantity: number
  total: number
  percent: number
  items: { name: string; quantity: number; total: number }[]
  groupTotal: number
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
      >
        <td className="px-4 py-2.5 text-muted-foreground tabular">{idx + 1}</td>
        <td className="px-3 py-2.5 text-muted-foreground">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-3 py-2.5 font-medium">{name}</td>
        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{quantity}</td>
        <td className="px-3 py-2.5 text-right font-bold tabular">{toMoney(total)}</td>
        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{percent.toFixed(1)}%</td>
      </tr>
      {isExpanded && items.map((it, i) => {
        const itemPercent = groupTotal > 0 ? (it.total / groupTotal) * 100 : 0
        return (
          <tr key={`${name}-${i}`} className="border-b border-border bg-muted/15">
            <td></td>
            <td></td>
            <td className="px-3 py-2 pl-10 text-foreground/80 truncate">{it.name}</td>
            <td className="px-3 py-2 text-right tabular text-muted-foreground">{it.quantity}</td>
            <td className="px-3 py-2 text-right tabular font-medium">{toMoney(it.total)}</td>
            <td className="px-3 py-2 text-right tabular text-muted-foreground">{itemPercent.toFixed(1)}%</td>
          </tr>
        )
      })}
    </>
  )
}

interface DancerRow {
  dancerSid: string
  dancerName: string
  billCount: number
  totalRevenue: number
  totalEmployee: number
  items: { name: string; quantity: number; total: number; employeeAmount: number }[]
}

function DancerReport({ data }: { data: { rows: DancerRow[]; grandRevenue: number; grandEmployee: number } }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (data.rows.length === 0) {
    return <EmptyState icon={<Users className="h-7 w-7 opacity-40" />} label="Бүжигчинтэй борлуулалт байхгүй байна" />
  }

  return (
    <table className="w-full text-sm bg-card">
      <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
        <tr className="border-b border-border text-muted-foreground">
          <th className="px-4 py-2.5 text-left font-medium w-12">#</th>
          <th className="px-3 py-2.5 text-left font-medium w-10"></th>
          <th className="px-3 py-2.5 text-left font-medium">Бүжигчин / Цэс</th>
          <th className="px-3 py-2.5 text-right font-medium w-24">Тооцоо</th>
          <th className="px-3 py-2.5 text-right font-medium w-32">Үйлчилгээ</th>
          <th className="px-3 py-2.5 text-right font-medium w-32">Бүжигчин</th>
          <th className="px-3 py-2.5 text-right font-medium w-20">%</th>
        </tr>
      </thead>
      <tbody>
        {data.rows.map((r, idx) => {
          const percent = data.grandEmployee > 0 ? (r.totalEmployee / data.grandEmployee) * 100 : 0
          const isExpanded = expanded === r.dancerSid
          return (
            <DancerRowGroup
              key={r.dancerSid}
              idx={idx}
              row={r}
              isExpanded={isExpanded}
              onToggle={() => setExpanded(isExpanded ? null : r.dancerSid)}
              percent={percent}
            />
          )
        })}
        <tr className="border-t-2 border-border bg-muted/40 font-bold">
          <td className="px-4 py-2.5" colSpan={3}>Нийт</td>
          <td className="px-3 py-2.5 text-right tabular"></td>
          <td className="px-3 py-2.5 text-right tabular">{toMoney(data.grandRevenue)}</td>
          <td className="px-3 py-2.5 text-right tabular">{toMoney(data.grandEmployee)}</td>
          <td className="px-3 py-2.5 text-right tabular">100%</td>
        </tr>
      </tbody>
    </table>
  )
}

function DancerRowGroup({
  idx, row, isExpanded, onToggle, percent,
}: {
  idx: number
  row: DancerRow
  isExpanded: boolean
  onToggle: () => void
  percent: number
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
      >
        <td className="px-4 py-2.5 text-muted-foreground tabular">{idx + 1}</td>
        <td className="px-3 py-2.5 text-muted-foreground">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium">{row.dancerName}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{row.billCount}</td>
        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{toMoney(row.totalRevenue)}</td>
        <td className="px-3 py-2.5 text-right font-bold tabular text-emerald-600">{toMoney(row.totalEmployee)}</td>
        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{percent.toFixed(1)}%</td>
      </tr>
      {isExpanded && row.items.map((it, i) => (
        <tr key={`${row.dancerSid}-${i}`} className="border-b border-border bg-muted/15">
          <td></td>
          <td></td>
          <td className="px-3 py-2 pl-10 text-foreground/80 truncate">{it.name}</td>
          <td className="px-3 py-2 text-right tabular text-muted-foreground">{it.quantity}</td>
          <td className="px-3 py-2 text-right tabular text-muted-foreground">{toMoney(it.total)}</td>
          <td className="px-3 py-2 text-right tabular font-medium">{toMoney(it.employeeAmount)}</td>
          <td></td>
        </tr>
      ))}
    </>
  )
}
