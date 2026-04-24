"use client"

import { Button } from "@/components/ui/button"
import { toMoney } from "@/lib/format"
import {
  ShoppingCart, Trash2, Plus, Minus, Printer, Sparkles, Receipt,
  Users, ArrowRight,
} from "lucide-react"
import type { UseSaleReturn } from "./use-sale"

export function BillPanel({ sale }: { sale: UseSaleReturn }) {
  const {
    billItems, setBillItems, billTotal, billItemCount,
    isTableBill, currentTableName,
    updateQuantity, clearBill,
    openPaymentDialog, printBill,
    openDancerChange,
  } = sale
  const activeCount = billItems.filter(i => !i.isCancelled).length

  return (
    <aside className="w-[380px] flex flex-col border-l border-border/60 bg-gradient-to-b from-card to-card/95 shadow-[-1px_0_3px_rgba(0,0,0,0.04)]">
      {/* ─── Header ─── */}
      <div className="px-5 pt-5 pb-4 border-b border-border/60 bg-gradient-to-br from-primary/[0.04] via-card to-card relative overflow-hidden">
        {/* Subtle accent blob */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/8 blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15">
              {isTableBill ? <Users className="h-[18px] w-[18px] text-primary" /> : <ShoppingCart className="h-[18px] w-[18px] text-primary" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {isTableBill ? "Ширээний билл" : "Хурдан захиалга"}
              </div>
              <div className="text-base font-bold tracking-tight truncate mt-0.5">
                {isTableBill ? currentTableName : (billItemCount > 0 ? `${billItemCount} зүйл` : "Хоосон")}
              </div>
            </div>
          </div>
          {billItems.length > 0 && (
            <button
              onClick={clearBill}
              title="Билл цэвэрлэх"
              className="shrink-0 h-9 w-9 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Items list ─── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 slim-scroll">
        {billItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 via-muted to-primary/5">
                <ShoppingCart className="h-9 w-9 text-muted-foreground/40" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-card">
                <Plus className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-sm font-medium mt-4">Билл хоосон байна</p>
            <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
              Зүүн талын цэснээс зүйл нэмж эхлээрэй
            </p>
          </div>
        ) : (
          billItems.map((item, index) => (
            <div
              key={item.menuSid}
              className={`group relative rounded-xl transition-all ${
                item.isCancelled
                  ? "bg-destructive/[0.04] ring-1 ring-destructive/10"
                  : "bg-card hover:bg-muted/40 ring-1 ring-border/50 hover:ring-border"
              }`}
            >
              <div className="flex items-start gap-2.5 p-2.5">
                {/* Index pill */}
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular ${
                  item.isCancelled
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}>
                  {index + 1}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm leading-snug truncate ${item.isCancelled ? "line-through text-muted-foreground" : ""}`}>
                    {item.name}
                  </div>
                  {!item.isCancelled ? (
                    <div className="text-xs text-muted-foreground tabular mt-0.5">
                      {toMoney(item.price)} × <span className="font-semibold text-foreground/70">{item.quantity}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-destructive mt-0.5 font-medium">Цуцлагдсан</div>
                  )}

                  {/* Dancer chip */}
                  {!item.isCancelled && item.dancerName && (
                    <button
                      onClick={() => openDancerChange(item.menuSid)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/15 cursor-pointer transition-colors"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {item.dancerName}
                    </button>
                  )}
                </div>

                {/* Qty controls + amount */}
                {item.isCancelled ? (
                  <Button
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setBillItems(prev => prev.map(i =>
                      i.menuSid === item.menuSid ? { ...i, isCancelled: false, quantity: 1, amount: i.price } : i
                    ))}
                  >
                    Сэргээх
                  </Button>
                ) : (
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="text-sm font-bold tabular leading-none">{toMoney(item.amount)}</div>
                    <div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/30 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.menuSid, item.quantity - 1)}
                        className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuSid, item.quantity + 1)}
                        className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="border-t border-border/60 bg-gradient-to-b from-card to-card/95">
        {/* Total summary */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Нийт дүн</span>
            {activeCount > 0 && (
              <span className="text-xs text-muted-foreground tabular">{activeCount} зүйл</span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight tabular leading-none">{toMoney(billTotal)}</span>
            <span className="text-base text-muted-foreground font-medium">₮</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-3 pb-3 space-y-2">
          <button
            onClick={openPaymentDialog}
            disabled={billItems.length === 0}
            className="sheen group relative w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base inline-flex items-center justify-center gap-2 px-5 shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--primary)_60%,transparent)] hover:brightness-110 active:translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Төлөлт хийх
            <ArrowRight className="h-4 w-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => printBill(false)}
              disabled={billItems.length === 0}
              className="h-9 rounded-xl border border-border/60 bg-card hover:bg-muted/60 text-sm font-medium flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="h-3.5 w-3.5" />
              Билл
            </button>
            <button
              onClick={() => printBill(true)}
              disabled={billItems.length === 0}
              className="h-9 rounded-xl border border-border/60 bg-card hover:bg-muted/60 text-sm font-medium flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Receipt className="h-3.5 w-3.5" />
              Е-баримт
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
