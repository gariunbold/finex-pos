"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { toMoney, datetimeToStr, today, dateToStr } from "@/lib/format"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Coins, Plus, Search, User, X, Save, ChevronDown } from "lucide-react"
import type { UseSaleReturn } from "./use-sale"

export function JetonsPanel({ sale }: { sale: UseSaleReturn }) {
  const { syncData, saveSingleChip, pendingSales } = sale
  const [chipsDate, setChipsDate] = useState<string>(() => today())
  const [chipsFilter, setChipsFilter] = useState<"all" | "unsent" | "sent">("all")
  const [searchChips, setSearchChips] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [dancerComboOpen, setDancerComboOpen] = useState(false)

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

  const dayChipsAll = useMemo(() => {
    const arr: any[] = []
    pendingSales.forEach((s: any) => {
      if (s.isDeleted || !s.chips || s.chips.length === 0) return
      const d = s.docDate || dateToStr(s.createdAt)
      if (d !== chipsDate) return
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
  }, [pendingSales, chipsDate])

  const dayChips = useMemo(() => {
    const q = searchChips.trim().toLowerCase()
    return dayChipsAll.filter((c) => {
      if (chipsFilter === "unsent" && c.uploaded) return false
      if (chipsFilter === "sent" && !c.uploaded) return false
      if (!q) return true
      return (
        (c.dancerName || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      )
    })
  }, [dayChipsAll, chipsFilter, searchChips])

  const chipsCounts = useMemo(() => {
    let unsent = 0, sent = 0
    dayChipsAll.forEach((c) => {
      if (c.uploaded) sent++
      else unsent++
    })
    return { all: unsent + sent, unsent, sent }
  }, [dayChipsAll])

  const dayTotal = dayChips.reduce((s, c) => s + (c.total || 0), 0)

  function resetForm() {
    setSelectedSid(null)
    setQtyStr("1")
    setPriceStr("")
    setDescription("")
    setDancerSearch("")
  }

  function handleSave() {
    const dancer = (syncData.dancers as any[]).find((d) => d.sid === selectedSid)
    const qty = parseFloat(qtyStr) || 0
    const price = parseFloat(priceStr) || 0
    if (!dancer || qty <= 0 || price <= 0) return
    const ok = saveSingleChip(dancer, qty, price, description.trim() || undefined)
    if (!ok) return
    setShowForm(false)
    resetForm()
  }

  const qtyNum = parseFloat(qtyStr) || 0
  const priceNum = parseFloat(priceStr) || 0
  const canAdd = !!selectedSid && qtyNum > 0 && priceNum > 0
  const selectedDancerName = (syncData.dancers as any[]).find((d) => d.sid === selectedSid)?.nickname ||
    (syncData.dancers as any[]).find((d) => d.sid === selectedSid)?.name || ""

  return (
    <div className="h-full flex flex-col bg-card/85 backdrop-blur-xl">
      {/* Title */}
      <div className="px-5 py-3">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Жетон
        </h1>
      </div>

      {/* Toolbar */}
      <div className="px-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker value={chipsDate} onChange={setChipsDate} />
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Бүжигчин / тайлбар хайх..."
              value={searchChips}
              onChange={(e) => setSearchChips(e.target.value)}
              className="pl-10 h-9 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-0.5">
            <FilterChip active={chipsFilter === "all"} onClick={() => setChipsFilter("all")} label="Бүгд" count={chipsCounts.all} />
            <FilterChip active={chipsFilter === "unsent"} onClick={() => setChipsFilter("unsent")} label="Илгээгээгүй" count={chipsCounts.unsent} accent="amber" />
            <FilterChip active={chipsFilter === "sent"} onClick={() => setChipsFilter("sent")} label="Илгээсэн" count={chipsCounts.sent} accent="emerald" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block text-sm text-muted-foreground tabular">
              {dayChips.length} бичилт · <span className="font-semibold text-foreground">{toMoney(dayTotal)}</span>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Шинэ
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-w-0 overflow-y-auto auto-scroll">
          {dayChips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
                <Coins className="h-7 w-7 opacity-40" />
              </div>
              <p className="text-sm">Жетоны бичилт байхгүй</p>
            </div>
          ) : (
            <table className="w-full text-sm bg-card">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium w-12">#</th>
                  <th className="px-3 py-2.5 text-left font-medium w-44">Огноо, цаг</th>
                  <th className="px-3 py-2.5 text-left font-medium">Бүжигчин</th>
                  <th className="px-3 py-2.5 text-right font-medium w-20">Тоо</th>
                  <th className="px-3 py-2.5 text-right font-medium w-32">Нэгж үнэ</th>
                  <th className="px-3 py-2.5 text-right font-medium w-32">Дүн</th>
                  <th className="px-3 py-2.5 text-left font-medium">Тайлбар</th>
                  <th className="px-3 py-2.5 text-left font-medium w-32">Статус</th>
                </tr>
              </thead>
              <tbody>
                {dayChips.map((c, idx) => (
                  <tr
                    key={`${c.saleId}-${c.id}-${idx}`}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-muted-foreground tabular">{idx + 1}</td>
                    <td className="px-3 py-2.5 tabular text-foreground/80">
                      {datetimeToStr(c.saleCreatedAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium truncate">{c.dancerName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{c.quantity}</td>
                    <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{toMoney(c.price)}</td>
                    <td className="px-3 py-2.5 text-right font-bold tabular text-emerald-600">+{toMoney(c.total)}</td>
                    <td className="px-3 py-2.5 text-foreground/80 truncate max-w-0">
                      {c.description || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.uploaded ? (
                        <span className="pill pill-success">Илгээсэн</span>
                      ) : (
                        <span className="pill pill-warn">Илгээгээгүй</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      {/* New jeton modal */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm() } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Шинэ жетон</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Dancer combo */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Бүжигчин</label>
              <Popover open={dancerComboOpen} onOpenChange={setDancerComboOpen}>
                <PopoverTrigger
                  render={(props) => (
                    <button
                      {...props}
                      type="button"
                      className="w-full h-9 px-3 rounded-lg border border-input bg-background flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className={`flex-1 text-left truncate ${selectedSid ? "" : "text-muted-foreground"}`}>
                        {selectedSid ? selectedDancerName : "Бүжигчин сонгох..."}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                />
                <PopoverContent align="start" className="w-[--anchor-width] p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Бүжигчин хайх..."
                      value={dancerSearch}
                      onChange={(e) => setDancerSearch(e.target.value)}
                      className="pl-9 h-8"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto auto-scroll space-y-0.5">
                    {dancers.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-4">Бүжигчин олдсонгүй</div>
                    ) : (
                      dancers.map((d: any) => (
                        <button
                          key={d.sid}
                          onClick={() => { setSelectedSid(d.sid); setDancerSearch(""); setDancerComboOpen(false) }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
                            selectedSid === d.sid ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate font-medium">{d.nickname || d.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Тоо ширхэг</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={qtyStr}
                  onChange={(e) => setQtyStr(e.target.value)}
                  min={1}
                  className="tabular"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Нэгж үнэ ₮</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  className="tabular"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Тайлбар (сонголттой)</label>
              <Input
                placeholder="жнь: VIP, 5-р ширээ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60">
              <span className="text-sm text-muted-foreground">Дүн</span>
              <span className="font-bold text-base tabular">{toMoney(qtyNum * priceNum)} ₮</span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={!canAdd}>
              <Save className="h-4 w-4" />
              Хадгалах
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); resetForm() }}
            >
              <X className="h-4 w-4" />
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterChip({
  active, onClick, label, count, accent,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  accent?: "amber" | "emerald"
}) {
  const accentClasses =
    active && accent === "amber"
      ? "bg-amber-500 text-white"
      : active && accent === "emerald"
        ? "bg-emerald-500 text-white"
        : active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
  const countClass =
    active
      ? "bg-white/20 text-current"
      : accent === "amber"
        ? "bg-amber-500/15 text-amber-600"
        : accent === "emerald"
          ? "bg-emerald-500/15 text-emerald-600"
          : "bg-muted text-muted-foreground"
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-8 px-3 rounded-lg inline-flex items-center gap-1.5 text-sm font-medium transition-all ${accentClasses}`}
    >
      {label}
      <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-md text-[11px] font-bold tabular ${countClass}`}>
        {count}
      </span>
    </button>
  )
}
