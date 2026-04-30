"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toMoney } from "@/lib/format"
import { Trash2, Plus, Printer, Search, Coins, X, Banknote, User } from "lucide-react"
import { getPaymentIcon } from "./helpers"
import type { UseSaleReturn } from "./use-sale"

export function PaymentDialog({ sale }: { sale: UseSaleReturn }) {
  const {
    paymentOpen, setPaymentOpen,
    billTotal, remainingAmount, paidTotal,
    paymentTypeSid, setPaymentTypeSid,
    paymentAmount, setPaymentAmount,
    paymentList, syncData,
    handleAddPayment, handleRemovePayment, handlePay,
    getPaymentTypeName,
  } = sale

  return (
    <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Төлбөр</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Нийт дүн + Үлдэгдэл */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <div className="text-xs text-muted-foreground">Нийт дүн</div>
              <div className="text-xl font-bold tabular tracking-tight mt-1">{toMoney(billTotal)}</div>
            </div>
            <div className={`rounded-xl px-4 py-3 ${remainingAmount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
              <div className="text-xs text-muted-foreground">Үлдэгдэл</div>
              <div className={`text-xl font-bold tabular tracking-tight mt-1 ${remainingAmount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {toMoney(Math.max(remainingAmount, 0))}
              </div>
            </div>
          </div>

          {/* Нэмсэн төлбөрүүд */}
          {paymentList.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto auto-scroll">
              {paymentList.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{getPaymentTypeName(p.paymentType)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular">{toMoney(p.amount)}</span>
                    <button onClick={() => handleRemovePayment(i)} className="text-muted-foreground hover:text-destructive transition-colors">
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
              <div className={`grid gap-2 ${syncData.paymentTypes.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                {syncData.paymentTypes.map((pt: any) => {
                  const isSelected = paymentTypeSid === pt.sid
                  const Icon = getPaymentIcon(pt.code || pt.name)
                  return (
                    <button
                      key={pt.sid}
                      onClick={() => setPaymentTypeSid(pt.sid)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{pt.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Дүн + Нэмэх */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Дүн"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="text-center text-base font-semibold tabular flex-1"
                />
                <Button onClick={handleAddPayment} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Нэмэх
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handlePay} disabled={paidTotal < billTotal}>
            <Banknote className="h-4 w-4" />
            Төлөх
          </Button>
          <Button variant="outline" onClick={() => setPaymentOpen(false)}>
            <X className="h-4 w-4" />
            Хаах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PrintPreviewDialog({ sale }: { sale: UseSaleReturn }) {
  const {
    printPreviewOpen, setPrintPreviewOpen,
    billItems, billTotal, isTableBill,
    currentTableName, deviceName, posUser,
    printPreviewEBarimt, doPrintBill,
  } = sale

  return (
    <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
      <DialogContent className="max-w-xs p-0">
        <div className="p-6 font-mono text-xs space-y-1">
          <div className="text-center font-bold text-sm">{deviceName}</div>
          <div className="text-center text-muted-foreground">{new Date().toLocaleString("mn-MN")}</div>
          {isTableBill && <div className="text-center font-bold">{currentTableName}</div>}
          {posUser && <div className="text-center text-muted-foreground">Кассчин: {posUser.name}</div>}
          <Separator className="my-2 border-dashed" />
          <div className="space-y-1">
            {billItems.filter(i => !i.isCancelled).map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span>{i + 1}. {item.name}</span>
                </div>
                <div className="flex justify-between pl-4 text-muted-foreground">
                  <span>{toMoney(item.price)} x {item.quantity}</span>
                  <span>{toMoney(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-2 border-dashed" />
          <div className="flex justify-between font-bold text-sm">
            <span>НИЙТ:</span>
            <span>{toMoney(billTotal)}</span>
          </div>
          {printPreviewEBarimt ? (
            <>
              <Separator className="my-2 border-dashed" />
              <div className="text-center font-bold">Е-БАРИМТ</div>
            </>
          ) : (
            <>
              <Separator className="my-2 border-dashed" />
              <div className="text-center text-muted-foreground">Е-баримтгүй</div>
            </>
          )}
          <div className="text-center text-muted-foreground mt-2">Баярлалаа!</div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button onClick={doPrintBill}>
            <Printer className="h-4 w-4" />
            Хэвлэх
          </Button>
          <Button variant="outline" onClick={() => setPrintPreviewOpen(false)}>
            <X className="h-4 w-4" />
            Хаах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DancerPickerDialog({ sale }: { sale: UseSaleReturn }) {
  const { dancerPickerOpen, setDancerPickerOpen, selectDancer, syncData } = sale
  const [search, setSearch] = useState("")

  const dancers = useMemo(() => {
    const list = (syncData.dancers || []) as any[]
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((d) =>
      (d.name || "").toLowerCase().includes(q) ||
      (d.nickname || "").toLowerCase().includes(q) ||
      (d.code || "").toLowerCase().includes(q)
    )
  }, [search, syncData.dancers])

  return (
    <Dialog open={dancerPickerOpen} onOpenChange={(open) => { if (!open) setDancerPickerOpen(false) }}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Бүжигчин сонгох</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Тайзны нэр хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto auto-scroll -mx-1 px-1">
          {dancers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">Бүжигчин олдсонгүй</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {dancers.map((d: any) => (
                <button
                  key={d.sid}
                  onClick={() => { selectDancer(d); setDancerPickerOpen(false); setSearch("") }}
                  title={d.nickname || d.name}
                  className="flex flex-col items-center gap-2 px-2 py-3 rounded-xl bg-muted hover:bg-primary/10 text-foreground transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium truncate max-w-full leading-tight">
                    {d.nickname || d.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setDancerPickerOpen(false); setSearch("") }}>
            <X className="h-4 w-4" />
            Хаах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

