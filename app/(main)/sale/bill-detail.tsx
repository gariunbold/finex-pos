"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toMoney } from "@/lib/format"
import {
  X, ReceiptText, Printer, Trash2, Clock, Users, Sparkles, Coins, Banknote,
  CheckCircle2, AlertCircle, Hash,
} from "lucide-react"
import type { UseSaleReturn } from "./use-sale"

interface BillDetailDialogProps {
  sale: UseSaleReturn
  bill: any | null
  onClose: () => void
}

export function BillDetailDialog({ sale, bill, onClose }: BillDetailDialogProps) {
  const { printClosedBill, handleDeleteSale, syncData } = sale

  if (!bill) return null

  const items = (bill.items || []) as any[]
  const activeItems = items.filter((i) => !i.isCancelled)
  const cancelledItems = items.filter((i) => i.isCancelled)
  const chips = (bill.chips || []) as any[]
  const payments = (bill.payments || []) as any[]
  const totalQty = activeItems.reduce((s, i) => s + (i.quantity || 1), 0)

  const getPaymentName = (sid: string) => {
    const pt = (syncData.paymentTypes as any[]).find((p: any) => p.sid === sid)
    return pt?.name || sid
  }

  const tableName = (() => {
    if (!bill.tableSid) return null
    const t = (syncData.tables as any[]).find((x: any) => x.sid === bill.tableSid)
    return t?.name || null
  })()

  function onDelete() {
    handleDeleteSale(bill.id)
    onClose()
  }

  function onPrint() {
    printClosedBill(bill)
  }

  return (
    <Dialog open={!!bill} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        style={{ maxWidth: "640px" }}
        className="p-0 gap-0 flex flex-col overflow-hidden max-h-[88vh] sm:max-w-[640px]"
      >
        {/* ───── Header ───── */}
        <DialogHeader className="px-5 py-4 border-b border-border/60 bg-gradient-to-br from-primary/[0.05] via-card to-card flex flex-row items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                Билл #{(bill.id || "").slice(-6).toUpperCase()}
                {bill.uploaded ? (
                  <span className="pill pill-success">
                    <CheckCircle2 className="h-3 w-3" />
                    Илгээсэн
                  </span>
                ) : (
                  <span className="pill pill-warn">
                    <AlertCircle className="h-3 w-3" />
                    Илгээгээгүй
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(bill.createdAt).toLocaleString("mn-MN")}
                </span>
                {tableName && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tableName}
                    </span>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* ───── Body (scrollable) ───── */}
        <div className="flex-1 overflow-y-auto slim-scroll px-5 py-4 space-y-4">
          {/* Items */}
          <Section title="Захиалга" icon={<Hash className="h-3.5 w-3.5" />} count={activeItems.length}>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 px-3 py-1.5 gap-3 font-medium">
                <span>№</span>
                <span>Нэр</span>
                <span className="text-right">Тоо</span>
                <span className="text-right">Үнэ</span>
                <span className="text-right">Дүн</span>
              </div>
              {activeItems.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-6">Захиалгагүй</div>
              ) : (
                activeItems.map((item, i) => (
                  <div
                    key={`${item.menuSid}-${i}`}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] text-sm px-3 py-2 gap-3 items-start border-t border-border/60"
                  >
                    <span className="tabular text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      {item.dancerName && (
                        <div className="inline-flex items-center gap-1 text-xs text-primary mt-0.5">
                          <Sparkles className="h-3 w-3" />
                          {item.dancerName}
                        </div>
                      )}
                    </div>
                    <span className="tabular text-right">{item.quantity}</span>
                    <span className="tabular text-right text-muted-foreground">{toMoney(item.price)}</span>
                    <span className="tabular text-right font-semibold">{toMoney(item.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </Section>

          {/* Cancelled items */}
          {cancelledItems.length > 0 && (
            <Section title="Цуцлагдсан" icon={<X className="h-3.5 w-3.5" />} count={cancelledItems.length} variant="destructive">
              <div className="rounded-xl border border-destructive/20 bg-destructive/[0.03] divide-y divide-destructive/10">
                {cancelledItems.map((item, i) => (
                  <div key={`c-${i}`} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                    <span className="line-through text-muted-foreground truncate">{item.name}</span>
                    <span className="text-destructive text-xs font-medium">Цуцлагдсан</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Chips / Jeton */}
          {chips.length > 0 && (
            <Section title="Жетон" icon={<Coins className="h-3.5 w-3.5" />} count={chips.length}>
              <div className="rounded-xl border border-border/60 divide-y divide-border/60">
                {chips.map((c, i) => (
                  <div key={`chip-${i}`} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{c.dancerName}</span>
                      {c.description && (
                        <span className="text-xs text-muted-foreground truncate">· {c.description}</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 tabular shrink-0">
                      <span className="text-xs text-muted-foreground">{c.quantity} × {toMoney(c.price)}</span>
                      <span className="font-semibold text-emerald-600">+{toMoney(c.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <Section title="Төлбөр" icon={<Banknote className="h-3.5 w-3.5" />} count={payments.length}>
              <div className="rounded-xl border border-border/60 divide-y divide-border/60">
                {payments.map((p: any, i: number) => (
                  <div key={`pay-${i}`} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{getPaymentName(p.paymentType)}</span>
                    <span className="font-bold tabular">{toMoney(p.amount)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ───── Footer ───── */}
        <div className="border-t border-border/60 bg-gradient-to-b from-card to-card/95 px-5 py-3 shrink-0">
          {/* Total */}
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Нийт дүн</div>
              <div className="text-xs text-muted-foreground tabular">{totalQty} зүйл</div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight tabular leading-none">{toMoney(bill.total)}</span>
              <span className="text-base text-muted-foreground font-medium">₮</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!bill.uploaded && (
              <Button
                variant="outline"
                onClick={onDelete}
                className="border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Устгах
              </Button>
            )}
            <Button variant="outline" onClick={onPrint} className="ml-auto">
              <Printer className="h-4 w-4 mr-1.5" />
              Хэвлэх
            </Button>
            <Button variant="outline" onClick={onClose}>Хаах</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({
  title, icon, count, variant, children,
}: {
  title: string
  icon: React.ReactNode
  count?: number
  variant?: "destructive"
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
          variant === "destructive" ? "text-destructive" : "text-muted-foreground"
        }`}>
          {icon}
          {title}
        </span>
        {count !== undefined && (
          <span className={`text-[11px] font-bold tabular px-1.5 rounded-md ${
            variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
          }`}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
