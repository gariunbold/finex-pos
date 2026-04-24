"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toMoney } from "@/lib/format"
import { ShoppingCart, Trash2, Plus, Minus, Printer, FileText, Sparkles, Coins } from "lucide-react"
import type { UseSaleReturn } from "./use-sale"

export function BillPanel({ sale }: { sale: UseSaleReturn }) {
  const {
    billItems, setBillItems, billTotal, billItemCount,
    isTableBill, currentTableName,
    updateQuantity, clearBill,
    openPaymentDialog, printBill, router,
    openDancerChange,
    setTipOpen,
    syncData,
  } = sale
  const isDancerEnabled = syncData.isDancerEnabled === 1

  return (
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
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${
                item.isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm leading-tight truncate ${item.isCancelled ? "line-through text-muted-foreground" : ""}`}>
                  {item.name}
                </div>
                {item.isCancelled ? (
                  <div className="text-sm text-destructive">Цуцлагдсан</div>
                ) : (
                  <div className="text-sm text-muted-foreground">{toMoney(item.price)} x {item.quantity}</div>
                )}
                {!item.isCancelled && item.dancerName && (
                  <button
                    onClick={() => openDancerChange(item.menuSid)}
                    className="mt-0.5 inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    {item.dancerName}
                  </button>
                )}
              </div>
              {item.isCancelled ? (
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
                  <div className="flex items-center gap-1">
                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuSid, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuSid, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm font-semibold w-20 text-right">{toMoney(item.amount)}</div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-card">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Нийт дүн</span>
            <span className="text-2xl font-bold tracking-tight">{toMoney(billTotal)}</span>
          </div>
        </div>
        <Separator />
        <div className="p-3 space-y-2">
          {isDancerEnabled && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setTipOpen(true)}
            >
              <Coins className="h-4 w-4 mr-2" />
              TIP нэмэх
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => printBill(false)}
              disabled={billItems.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Билл хэвлэх
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => printBill(true)}
              disabled={billItems.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Е-баримт
            </Button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => router.push("/cash")}>
            Касс хаах
          </Button>
        </div>
      </div>
    </div>
  )
}
