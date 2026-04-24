"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toMoney } from "@/lib/format"
import { Coins, Plus, Search, Sparkles, Trash2 } from "lucide-react"
import type { UseSaleReturn } from "./use-sale"

export function JetonsPanel({ sale }: { sale: UseSaleReturn }) {
  const { syncData, addChip, billChips, removeChip, savePendingChips, pendingSales } = sale
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [showForm, setShowForm] = useState(false)
  const [dancerSearch, setDancerSearch] = useState("")
  const [selectedSid, setSelectedSid] = useState<string | null>(null)
  const [qtyStr, setQtyStr] = useState("1")
  const [priceStr, setPriceStr] = useState("")
  const [description, setDescription] = useState("")

  const dancers = useMemo(() => {
    const q = dancerSearch.trim().toLowerCase()
    const list = (syncData.dancers || []) as any[]
    if (!q) return list
    return list.filter((d) =>
      (d.name || "").toLowerCase().includes(q) ||
      (d.nickname || "").toLowerCase().includes(q) ||
      (d.code || "").toLowerCase().includes(q)
    )
  }, [dancerSearch, syncData.dancers])

  const dayChips = useMemo(() => {
    const arr: any[] = []
    pendingSales.forEach((s: any) => {
      if (s.isDeleted || !s.chips || s.chips.length === 0) return
      const saleDate = String(s.createdAt || "").slice(0, 10)
      if (saleDate !== selectedDate) return
      s.chips.forEach((c: any) => {
        arr.push({
          ...c,
          saleId: s.id,
          saleCreatedAt: s.createdAt,
          uploaded: s.uploaded,
        })
      })
    })
    return arr.sort((a, b) => new Date(b.saleCreatedAt).getTime() - new Date(a.saleCreatedAt).getTime())
  }, [pendingSales, selectedDate])

  const dayTotal = dayChips.reduce((s, c) => s + (c.total || 0), 0)
  const dayQty = dayChips.reduce((s, c) => s + (c.quantity || 0), 0)
  const stagingTotal = billChips.reduce((s, c) => s + c.total, 0)

  function resetForm() {
    setSelectedSid(null)
    setQtyStr("1")
    setPriceStr("")
    setDescription("")
    setDancerSearch("")
  }

  function addToStaging() {
    const dancer = (syncData.dancers as any[]).find((d) => d.sid === selectedSid)
    const qty = parseFloat(qtyStr) || 0
    const price = parseFloat(priceStr) || 0
    if (!dancer || qty <= 0 || price <= 0) return
    addChip(dancer, qty, price, description.trim() || undefined)
    resetForm()
  }

  function doSave() {
    savePendingChips()
    setShowForm(false)
  }

  function formatTime(iso: string) {
    try {
      const d = new Date(iso)
      const hh = String(d.getHours()).padStart(2, "0")
      const mm = String(d.getMinutes()).padStart(2, "0")
      return `${hh}:${mm}`
    } catch {
      return ""
    }
  }

  const qtyNum = parseFloat(qtyStr) || 0
  const priceNum = parseFloat(priceStr) || 0
  const canAdd = !!selectedSid && qtyNum > 0 && priceNum > 0
  const selectedDancerName = (syncData.dancers as any[]).find((d) => d.sid === selectedSid)?.nickname ||
    (syncData.dancers as any[]).find((d) => d.sid === selectedSid)?.name || ""

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-44"
        />
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 border px-3 h-9 text-sm">
          <span className="text-muted-foreground">
            {selectedDate === today ? "Өнөөдөр" : selectedDate}:
          </span>
          <span className="font-semibold">{dayChips.length} · {dayQty} ш · {toMoney(dayTotal)}</span>
        </div>
        <div className="ml-auto">
          <Button
            onClick={() => setShowForm((v) => !v)}
            variant={showForm ? "outline" : "default"}
          >
            <Plus className="h-4 w-4 mr-1" />
            {showForm ? "Хаах" : "Шинэ"}
          </Button>
        </div>
      </div>

      {/* Split layout: list (left) | form (right) */}
      <div className="flex-1 flex gap-3 px-4 pb-4 min-h-0">
        {/* List */}
        <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto slim-scroll p-3 space-y-1.5">
            {dayChips.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
                  <Coins className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm">Жетоны бичилт байхгүй</p>
                <p className="text-sm text-muted-foreground/60 mt-1">"Шинэ" товчоор бүртгэнэ үү</p>
              </div>
            ) : (
              dayChips.map((c, idx) => (
                <div
                  key={`${c.saleId}-${c.id}-${idx}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.dancerName}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {c.quantity} × {toMoney(c.price)}
                      {c.description ? ` · ${c.description}` : ""}
                      {" · "}{formatTime(c.saleCreatedAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-emerald-600">+{toMoney(c.total)}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.uploaded ? "Илгээсэн" : "Илгээгээгүй"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inline form */}
        {showForm && (
          <div className="w-[380px] shrink-0 rounded-xl border bg-card overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">Шинэ жетон</h3>
              {billChips.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {billChips.length} шинэ · {toMoney(stagingTotal)}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto slim-scroll p-4 space-y-3">
              {/* Staging */}
              {billChips.length > 0 && (
                <div className="border rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto slim-scroll">
                  {billChips.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="flex-1 truncate">{c.dancerName}</span>
                      <span className="text-muted-foreground text-sm">{c.quantity}×{toMoney(c.price)}</span>
                      <span className="font-semibold w-20 text-right">{toMoney(c.total)}</span>
                      <button
                        onClick={() => removeChip(c.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!selectedSid ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Бүжигчин хайх..."
                      value={dancerSearch}
                      onChange={(e) => setDancerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-1 max-h-[280px] overflow-y-auto slim-scroll">
                    {dancers.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-6">Бүжигчин олдсонгүй</div>
                    )}
                    {dancers.map((d: any) => (
                      <button
                        key={d.sid}
                        onClick={() => setSelectedSid(d.sid)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{d.nickname || d.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {d.nickname ? d.name : d.code}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-2.5 rounded-lg bg-muted/50 flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{selectedDancerName}</div>
                    </div>
                    <button
                      onClick={() => setSelectedSid(null)}
                      className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Өөрчлөх
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Тоо</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={qtyStr}
                        onChange={(e) => setQtyStr(e.target.value)}
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Нэгж үнэ ₮</label>
                      <Input
                        autoFocus
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={priceStr}
                        onChange={(e) => setPriceStr(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Тайлбар (сонголттой)</label>
                    <Input
                      placeholder="жнь: VIP, 5-р ширээ..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-md bg-primary/5 text-sm">
                    <span className="text-muted-foreground">Дүн</span>
                    <span className="font-bold text-base">{toMoney(qtyNum * priceNum)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSelectedSid(null)}>
                      Буцах
                    </Button>
                    <Button onClick={addToStaging} disabled={!canAdd} className="flex-1">
                      <Plus className="h-4 w-4 mr-1" />
                      Нэмэх
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <Button
                onClick={doSave}
                disabled={billChips.length === 0}
                className="w-full"
              >
                Хадгалах {billChips.length > 0 && `(${toMoney(stagingTotal)})`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
