"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toMoney } from "@/lib/format"
import { Trash2, Plus, Printer } from "lucide-react"
import { getPaymentIcon } from "./helpers"
import type { UseSaleReturn } from "./use-sale"

export function PaymentDialog({ sale }: { sale: UseSaleReturn }) {
  const {
    paymentOpen, setPaymentOpen,
    billTotal, remainingAmount, paidTotal,
    paymentTypeSid, setPaymentTypeSid,
    paymentAmount, setPaymentAmount,
    paymentList, selectedPt, syncData,
    handleAddPayment, handleRemovePayment, handlePay,
    getPaymentTypeName,
  } = sale

  return (
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
          <Button variant="outline" onClick={() => setPrintPreviewOpen(false)}>
            Хаах
          </Button>
          <Button onClick={doPrintBill}>
            <Printer className="h-4 w-4 mr-2" />
            Хэвлэх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
