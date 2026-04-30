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
    isTableBill, currentTableName, currentBillId,
    selectedRoomSid, syncData,
    updateQuantity, clearBill,
    openPaymentDialog, printBill,
    openDancerChange,
  } = sale
  const activeCount = billItems.filter(i => !i.isCancelled).length
  const roomName = (syncData.rooms as any[]).find((r: any) => r.sid === selectedRoomSid)?.name
  const billNo = currentBillId ? currentBillId.slice(-6).toUpperCase() : null

  return (
    <aside className="w-[380px] flex flex-col border-l border-border bg-card">
      {/* ─── Header ─── */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isTableBill ? <Users className="h-[18px] w-[18px]" /> : <ShoppingCart className="h-[18px] w-[18px]" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="uppercase tracking-wider font-medium">
                  {isTableBill ? "Ширээний билл" : "Тооцооны хуудас"}
                </span>
                {billNo && (
                  <span className="tabular font-medium text-foreground/70">№{billNo}</span>
                )}
              </div>
              <div className="text-base font-bold tracking-tight truncate mt-0.5">
                {isTableBill
                  ? (roomName ? `${roomName} · ${currentTableName}` : currentTableName)
                  : (billItemCount > 0 ? `${billItemCount} зүйл` : "Хоосон")}
              </div>
            </div>
          </div>
          {billItems.length > 0 && (
            <button
              onClick={clearBill}
              title="Билл цэвэрлэх"
              className="shrink-0 h-9 w-9 rounded-lg bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Items list ─── */}
      <div className="flex-1 overflow-y-auto auto-scroll px-3 pb-3 space-y-1.5">
        {billItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <ShoppingCart className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium mt-4">Билл хоосон байна</p>
            <p className="text-xs text-muted-foreground mt-1">
              Зүүн талын цэснээс зүйл нэмж эхлээрэй
            </p>
          </div>
        ) : (
          billItems.map((item, index) => (
            <div
              key={item.menuSid}
              className={`rounded-lg p-2.5 ${
                item.isCancelled ? "bg-destructive/5" : "bg-muted/40"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Index */}
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold tabular ${
                  item.isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
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

                {/* Qty + amount */}
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
                    <div className="flex items-center gap-0.5 rounded-md bg-card p-0.5">
                      <button
                        onClick={() => updateQuantity(item.menuSid, item.quantity - 1)}
                        className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuSid, item.quantity + 1)}
                        className="h-6 w-6 rounded hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-colors"
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
      <div className="border-t border-border">
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

        <div className="px-3 pb-3 space-y-2">
          <button
            onClick={openPaymentDialog}
            disabled={billItems.length === 0}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 px-5 hover:brightness-110 active:translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Төлөлт хийх
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => printBill(false)}
              disabled={billItems.length === 0}
              className="h-9 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium flex items-center justify-center gap-1.5 text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="h-3.5 w-3.5" />
              Билл
            </button>
            <button
              onClick={() => printBill(true)}
              disabled={billItems.length === 0}
              className="h-9 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium flex items-center justify-center gap-1.5 text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
