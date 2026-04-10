"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePosStore } from "@/lib/store"
import type { PendingSale } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toMoney } from "@/lib/format"
import {
  ArrowLeft, BarChart3, Banknote, CreditCard, QrCode,
  TrendingUp, ShoppingBag, Layers, Receipt,
} from "lucide-react"

type Tab = "payment" | "menugroup"

function getPaymentLabel(sid: string, syncData: any): { label: string; icon: typeof Banknote } {
  const pt = syncData.paymentTypes?.find((p: any) => p.sid === sid)
  if (!pt) return { label: sid, icon: Receipt }
  const lower = (pt.code || pt.name || '').toLowerCase()
  if (lower.includes('cash') || lower.includes('бэлэн')) return { label: pt.name, icon: Banknote }
  if (lower.includes('card') || lower.includes('карт')) return { label: pt.name, icon: CreditCard }
  if (lower.includes('qr') || lower.includes('qpay')) return { label: pt.name, icon: QrCode }
  return { label: pt.name, icon: Receipt }
}

export default function PosReportPage() {
  const router = useRouter()
  const { isPaired, posUser, pendingSales, syncData, openBills } = usePosStore()

  const [tab, setTab] = useState<Tab>("payment")

  useEffect(() => {
    if (!isPaired || !posUser) {
      router.replace("/login")
    }
  }, [isPaired, posUser, router])

  // Бүх борлуулалт (pending + paid open bills)
  const allSales: PendingSale[] = useMemo(() => {
    const paidBills: PendingSale[] = openBills
      .filter(b => b.isPaid)
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
    return [...pendingSales, ...paidBills]
  }, [pendingSales, openBills])

  // ═══ Төлбөрийн тайлан ═══
  const paymentSummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    let grandTotal = 0
    let saleCount = allSales.length

    for (const sale of allSales) {
      grandTotal += sale.total || 0
      for (const p of (sale.payments || [])) {
        const existing = map.get(p.paymentType) || { count: 0, total: 0 }
        existing.count += 1
        existing.total += p.amount
        map.set(p.paymentType, existing)
      }
    }

    const items = Array.from(map.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.total - a.total)

    return { items, grandTotal, saleCount }
  }, [allSales])

  // ═══ Цэсний бүлгийн тайлан ═══
  const menuGroupSummary = useMemo(() => {
    // menuSid → groupSid mapping
    const menuToGroup = new Map<string, string>()
    for (const menu of syncData.menus) {
      menuToGroup.set(menu.sid, menu.groupSid || menu.group_sid)
    }

    // groupSid → name mapping
    const groupNames = new Map<string, string>()
    for (const g of syncData.menuGroups) {
      groupNames.set(g.sid, g.name)
    }

    // Group-ээр нэгтгэх
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

        // Цэс тус бүрээр
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

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Тайлан</h1>
              <p className="text-sm text-muted-foreground leading-tight">
                Нийт {allSales.length} борлуулалт
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
            <Button
              variant={tab === "payment" ? "default" : "outline"}
              className={tab === "payment" ? "" : "border-0 bg-transparent hover:bg-background"}
              onClick={() => setTab("payment")}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Төлбөрийн төрөл
            </Button>
            <Button
              variant={tab === "menugroup" ? "default" : "outline"}
              className={tab === "menugroup" ? "" : "border-0 bg-transparent hover:bg-background"}
              onClick={() => setTab("menugroup")}
            >
              <Layers className="h-4 w-4 mr-2" />
              Цэсний бүлэг
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 slim-scroll">
        {tab === "payment" ? (
          <PaymentReport data={paymentSummary} />
        ) : (
          <MenuGroupReport data={menuGroupSummary} />
        )}
      </div>
    </div>
  )
}

// ═══ Төлбөрийн төрлийн тайлан ═══
function PaymentReport({ data }: { data: { items: { type: number; count: number; total: number }[]; grandTotal: number; saleCount: number } }) {
  if (data.saleCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
          <Receipt className="h-8 w-8 opacity-40" />
        </div>
        <p className="text-sm">Борлуулалт байхгүй байна</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Нийт дүн */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Нийт борлуулалт</div>
            <div className="text-2xl font-bold tracking-tight">{toMoney(data.grandTotal)}</div>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Тооцоо: <span className="font-semibold text-foreground">{data.saleCount}</span></span>
          <span>Төлбөрийн төрөл: <span className="font-semibold text-foreground">{data.items.length}</span></span>
        </div>
      </Card>

      {/* Төрөл бүрээр */}
      <div className="space-y-2">
        {data.items.map((item) => {
          const config = getPaymentLabel(item.type, syncData)
          const Icon = config.icon
          const percent = data.grandTotal > 0 ? (item.total / data.grandTotal) * 100 : 0

          return (
            <Card key={item.type} className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{config.label}</span>
                    <span className="text-sm font-bold">{toMoney(item.total)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-sm text-muted-foreground">
                    <span>{item.count} тооцоо</span>
                    <span>{percent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ═══ Цэсний бүлгийн тайлан ═══
function MenuGroupReport({ data }: { data: { groups: { name: string; quantity: number; total: number; items: { name: string; quantity: number; total: number }[] }[]; grandTotal: number } }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  if (data.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
          <ShoppingBag className="h-8 w-8 opacity-40" />
        </div>
        <p className="text-sm">Борлуулалт байхгүй байна</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Нийт */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Нийт борлуулалт</div>
            <div className="text-2xl font-bold tracking-tight">{toMoney(data.grandTotal)}</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Бүлэг: <span className="font-semibold text-foreground">{data.groups.length}</span>
        </div>
      </Card>

      {/* Бүлэг бүрээр */}
      <div className="space-y-2">
        {data.groups.map((group) => {
          const percent = data.grandTotal > 0 ? (group.total / data.grandTotal) * 100 : 0
          const isExpanded = expandedGroup === group.name

          return (
            <Card key={group.name} className="overflow-hidden">
              {/* Group header */}
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedGroup(isExpanded ? null : group.name)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold">{group.name}</span>
                      <span className="text-sm font-bold">{toMoney(group.total)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-sm text-muted-foreground">
                      <span>{group.quantity} ширхэг &middot; {group.items.length} төрөл</span>
                      <span>{percent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Дэлгэрэнгүй цэсүүд */}
              {isExpanded && (
                <div className="border-t bg-muted/20">
                  <div className="px-4 py-2">
                    {/* Table header */}
                    <div className="flex items-center text-sm text-muted-foreground py-1.5 border-b border-border/50">
                      <span className="flex-1">Цэс</span>
                      <span className="w-20 text-right">Тоо</span>
                      <span className="w-28 text-right">Дүн</span>
                      <span className="w-16 text-right">%</span>
                    </div>
                    {/* Items */}
                    {group.items.map((item, idx) => {
                      const itemPercent = group.total > 0 ? (item.total / group.total) * 100 : 0
                      return (
                        <div
                          key={idx}
                          className="flex items-center text-sm py-2 border-b border-border/30 last:border-0"
                        >
                          <span className="flex-1 truncate font-medium">{item.name}</span>
                          <span className="w-20 text-right text-muted-foreground">{item.quantity}</span>
                          <span className="w-28 text-right font-semibold">{toMoney(item.total)}</span>
                          <span className="w-16 text-right text-muted-foreground">{itemPercent.toFixed(1)}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
