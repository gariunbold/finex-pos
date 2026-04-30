"use client"

import { Suspense, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toMoney, toMoney0, datetimeToStr } from "@/lib/format"
import {
  Search, LayoutGrid, ArrowLeft,
  Users, FileText, Coins,
} from "lucide-react"
import { LucideIcon, getMenuImageSrc } from "./helpers"
import { useSale } from "./use-sale"
import { BillPanel } from "./bill-panel"
import { JetonsPanel } from "./jetons-panel"
import { BillDetailDialog } from "./bill-detail"
import { PaymentDialog, PrintPreviewDialog, DancerPickerDialog } from "./dialogs"

export default function PosSalePage() {
  return (
    <Suspense fallback={null}>
      <PosSaleContent />
    </Suspense>
  )
}

function PosSaleContent() {
  const sale = useSale()
  const [openBillDetail, setOpenBillDetail] = useState<any | null>(null)

  const {
    syncData,
    saleMode, showMenuPanel, showBillsPanel, showJetonsPanel, isTableBill,
    searchMenu, setSearchMenu, selectedGroupSid, setSelectedGroupSid,
    filteredMenus, addMenuItem, billItems,
    selectedRoomSid, setSelectedRoomSid,
    currentTableName,
    filteredTables, getTableBill, handleTableClick, handleBackToTables,
    searchBills, setSearchBills,
    billsDate, setBillsDate,
    filteredBills, billsFilter, setBillsFilter, billsCounts,
    handleSwitchMode,
    pendingSales,
  } = sale

  const tablesMap = useMemo(() => {
    const m = new Map<string, any>()
    for (const t of syncData.tables as any[]) m.set(t.sid, t)
    return m
  }, [syncData.tables])

  const roomsMap = useMemo(() => {
    const m = new Map<string, any>()
    for (const r of syncData.rooms as any[]) m.set(r.sid, r)
    return m
  }, [syncData.rooms])

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    let revenue = 0, count = 0
    pendingSales.forEach((s: any) => {
      if (s.isDeleted) return
      const d = String(s.createdAt || "").slice(0, 10)
      if (d !== today) return
      revenue += s.total || 0
      count += 1
    })
    const occupied = (syncData.tables as any[]).filter((t: any) => !!getTableBill(t.sid)).length
    return { revenue, count, occupied, totalTables: (syncData.tables as any[]).length }
  }, [pendingSales, syncData.tables, getTableBill])

  const navItems = [
    { key: "tables", icon: LayoutGrid, label: "Ширээ", mode: "tables" as const, active: saleMode === "tables" || isTableBill || saleMode === "menu" },
  ]

  return (
    <div className="flex h-full bg-background">
      {/* ═══════════════ Main column ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`bg-card/85 backdrop-blur-xl ${showJetonsPanel ? "" : "border-b border-border/60"}`}>
          {showBillsPanel && (
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Тооцооны хуудас
              </h1>
            </div>
          )}

          {showMenuPanel && (
            <div className="px-5 py-3 space-y-3">
              <div className="flex gap-2">
                {isTableBill && (
                  <button
                    onClick={handleBackToTables}
                    className="h-9 px-3 rounded-lg bg-muted hover:bg-muted/70 text-foreground text-sm font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Ширээ
                  </button>
                )}
                {isTableBill && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 h-9">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{currentTableName}</span>
                  </div>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Цэс хайх..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className="pl-10 h-9 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto auto-scroll">
                <MenuCategoryTile
                  active={selectedGroupSid === null}
                  onClick={() => setSelectedGroupSid(null)}
                  label="Бүгд"
                  icon={<LayoutGrid className="h-[18px] w-[18px]" />}
                />
                {syncData.menuGroups.map((group: any) => (
                  <MenuCategoryTile
                    key={group.sid}
                    active={selectedGroupSid === group.sid}
                    onClick={() => setSelectedGroupSid(group.sid)}
                    label={group.name}
                    icon={group.iconName ? <LucideIcon name={group.iconName} className="h-[18px] w-[18px]" /> : <Coins className="h-[18px] w-[18px]" />}
                  />
                ))}
              </div>
            </div>
          )}

          {saleMode === "tables" && !isTableBill && (
            <div className="flex gap-2 overflow-x-auto px-5 py-4 auto-scroll">
              {syncData.rooms.map((room: any) => {
                const tablesHere = (syncData.tables as any[]).filter((t: any) => t.roomSid === room.sid)
                const occupiedHere = tablesHere.filter((t: any) => !!getTableBill(t.sid)).length
                return (
                  <RoomTile
                    key={room.sid}
                    active={selectedRoomSid === room.sid}
                    onClick={() => setSelectedRoomSid(room.sid)}
                    name={room.name}
                    occupied={occupiedHere}
                    total={tablesHere.length}
                  />
                )
              })}
            </div>
          )}

          {showBillsPanel && (
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <DatePicker value={billsDate} onChange={setBillsDate} />
                <div className="relative w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Тооцоо хайх..."
                    value={searchBills}
                    onChange={(e) => setSearchBills(e.target.value)}
                    className="pl-10 h-9 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-0.5">
                  <BillsFilterChip active={billsFilter === "all"} onClick={() => setBillsFilter("all")} label="Бүгд" count={billsCounts.all} />
                  <BillsFilterChip active={billsFilter === "unsent"} onClick={() => setBillsFilter("unsent")} label="Илгээгээгүй" count={billsCounts.unsent} accent="amber" />
                  <BillsFilterChip active={billsFilter === "sent"} onClick={() => setBillsFilter("sent")} label="Илгээсэн" count={billsCounts.sent} accent="emerald" />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ═══ Content ═══ */}
        <div className={`flex-1 min-h-0 bg-muted/15 ${showJetonsPanel ? "overflow-hidden" : showBillsPanel ? "overflow-y-auto auto-scroll" : "overflow-y-auto p-5 slim-scroll"}`}>
          {showJetonsPanel ? (
            <JetonsPanel sale={sale} />
          ) : showMenuPanel ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 content-start">
              {filteredMenus.map((menu: any) => {
                const inBill = billItems.find(item => item.menuSid === menu.sid && !item.isCancelled)
                return (
                  <Tooltip key={menu.sid}>
                    <TooltipTrigger
                      render={(props) => (
                        <button
                          {...props}
                          onClick={() => addMenuItem(menu)}
                          className={`group relative text-left rounded-2xl overflow-hidden flex flex-col h-full transition-colors active:scale-[0.97] ${
                            inBill
                              ? "bg-primary/10"
                              : "bg-muted hover:bg-muted/70"
                          }`}
                        >
                          {inBill && (
                            <div className="absolute top-2.5 right-2.5 z-20 flex h-6 min-w-6 px-1.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold tabular">
                              ×{inBill.quantity}
                            </div>
                          )}

                          <div className="aspect-[4/3] w-full overflow-hidden relative shrink-0 bg-background/40">
                            {menu.imageCode ? (
                              <img
                                src={getMenuImageSrc(menu.imageCode) || ''}
                                alt={menu.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement
                                  img.style.display = 'none'
                                  const sib = img.nextElementSibling as HTMLElement | null
                                  if (sib) sib.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              className="absolute inset-0 w-full h-full flex items-center justify-center px-3"
                              style={{ display: menu.imageCode ? 'none' : 'flex' }}
                            >
                              <span className="text-5xl font-black text-foreground/15 leading-none truncate select-none">
                                {(menu.name || "?").trim().slice(0, 1).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 px-3 py-3 flex flex-col gap-1">
                            {menu.code && (
                              <div className="text-xs text-muted-foreground tabular truncate">{menu.code}</div>
                            )}
                            <div className="font-semibold text-sm leading-tight truncate">{menu.name}</div>
                            <div className="mt-auto text-right text-base font-bold tabular text-primary leading-none">
                              {toMoney0(menu.price || 0)} ₮
                            </div>
                          </div>
                        </button>
                      )}
                    />
                    <TooltipContent>{menu.name}</TooltipContent>
                  </Tooltip>
                )
              })}
              {filteredMenus.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
                    <Search className="h-7 w-7 opacity-40" />
                  </div>
                  <p className="text-sm">Цэс олдсонгүй</p>
                </div>
              )}
            </div>
          ) : showBillsPanel ? (
            filteredBills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
                  <FileText className="h-7 w-7 opacity-40" />
                </div>
                <p className="text-sm">Тооцоо олдсонгүй</p>
              </div>
            ) : (
              <table className="w-full text-sm bg-card">
                <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium w-12">#</th>
                    <th className="px-3 py-2.5 text-left font-medium w-44">Огноо, цаг</th>
                    <th className="px-3 py-2.5 text-left font-medium">Бичиг №</th>
                    <th className="px-3 py-2.5 text-left font-medium w-32">Заал</th>
                    <th className="px-3 py-2.5 text-left font-medium w-32">Ширээ</th>
                    <th className="px-3 py-2.5 text-right font-medium w-32">Дүн</th>
                    <th className="px-3 py-2.5 text-right font-medium w-16">Зүйл</th>
                    <th className="px-3 py-2.5 text-left font-medium w-32">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill, idx) => {
                    const activeItems = bill.items.filter((i: any) => !i.isCancelled)
                    const itemCount = activeItems.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
                    const table = bill.tableSid ? tablesMap.get(bill.tableSid) : null
                    const room = table?.roomSid ? roomsMap.get(table.roomSid) : null
                    return (
                      <tr
                        key={bill.id}
                        onClick={() => setOpenBillDetail(bill)}
                        className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2.5 text-muted-foreground tabular">{idx + 1}</td>
                        <td className="px-3 py-2.5 tabular text-foreground/80">
                          {datetimeToStr(bill.createdAt)}
                        </td>
                        <td className="px-3 py-2.5 tabular text-foreground/80 truncate">
                          {bill.id}
                        </td>
                        <td className="px-3 py-2.5 text-foreground/80 truncate">
                          {room?.name || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-foreground/80 truncate">
                          {table?.name || (bill.tableSid ? "—" : "Шууд")}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold tabular">
                          {toMoney(bill.total)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">
                          {itemCount}
                        </td>
                        <td className="px-3 py-2.5">
                          {bill.uploaded ? (
                            <span className="pill pill-success">Илгээсэн</span>
                          ) : (
                            <span className="pill pill-warn">Илгээгээгүй</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 content-start">
              {filteredTables.map((table: any) => {
                const bill = getTableBill(table.sid)
                const isOccupied = !!bill
                const nameLen = (table.name || "").length
                const nameSizeClass =
                  nameLen <= 3 ? "text-3xl" :
                  nameLen <= 6 ? "text-xl" :
                  "text-base"
                return (
                  <button
                    key={table.sid}
                    onClick={() => handleTableClick(table)}
                    className="relative aspect-square rounded-2xl px-3 py-3 flex items-center justify-center transition-colors active:scale-[0.97] bg-muted text-foreground hover:bg-muted/70"
                  >
                    {isOccupied && (
                      <div className="absolute top-2.5 left-2.5 flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className={`font-bold tracking-tight text-center leading-none line-clamp-2 break-words ${nameSizeClass}`}>
                      {table.name}
                    </div>
                    {isOccupied && (
                      <div className="absolute bottom-2.5 right-2.5 text-sm font-semibold tabular leading-none text-primary">
                        {toMoney0(bill.totalAmount)} ₮
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {!showBillsPanel && !showJetonsPanel && <BillPanel sale={sale} />}

      <PaymentDialog sale={sale} />
      <PrintPreviewDialog sale={sale} />
      <DancerPickerDialog sale={sale} />
      <BillDetailDialog sale={sale} bill={openBillDetail} onClose={() => setOpenBillDetail(null)} />
    </div>
  )
}

function KpiBadge({
  label, value, icon, accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent: "primary" | "emerald" | "amber"
}) {
  const accentMap: Record<string, string> = {
    primary: "from-primary/15 to-primary/5 text-primary border-primary/20",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 border-emerald-500/20",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600 border-amber-500/20",
  }
  return (
    <div className={`flex items-center gap-2.5 h-9 px-3 rounded-xl bg-gradient-to-br border ${accentMap[accent]}`}>
      <div className="opacity-80">{icon}</div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-sm font-bold tabular mt-0.5">{value}</span>
      </div>
    </div>
  )
}

function MenuCategoryTile({
  active, onClick, label, icon, count,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-16 min-w-16 max-w-[120px] px-3 py-1 rounded-xl text-sm font-medium flex flex-col items-center justify-center gap-1 transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/70"
      }`}
    >
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="truncate max-w-full text-xs leading-tight">{label}</span>
      {count !== undefined && (
        <span className={`tabular text-[10px] ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function RoomTile({
  active, onClick, name, occupied, total,
}: {
  active: boolean
  onClick: () => void
  name: string
  occupied: number
  total: number
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-12 px-4 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/70"
      }`}
    >
      <span className="truncate">{name}</span>
      <span className={`tabular text-xs ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
        {occupied}/{total}
      </span>
    </button>
  )
}

function BillsFilterChip({
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
