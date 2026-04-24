"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { toMoney } from "@/lib/format"
import {
  Search, Download, Upload, LogOut, LayoutGrid, ArrowLeft,
  Users, BarChart3, FileText, Coins, Clock, ReceiptText, Sparkles, Settings, ChevronRight,
  Lock, LockOpen, Banknote,
} from "lucide-react"
import { LucideIcon, getMenuImageSrc } from "./helpers"
import { useSale } from "./use-sale"
import { BillPanel } from "./bill-panel"
import { JetonsPanel } from "./jetons-panel"
import { BillDetailDialog } from "./bill-detail"
import { PaymentDialog, PrintPreviewDialog, DancerPickerDialog } from "./dialogs"
import { usePosStore } from "@/lib/store"

export default function PosSalePage() {
  const sale = useSale()
  const cashSession = usePosStore((s) => s.cashSession)
  const [now, setNow] = useState<Date | null>(null)
  const [openBillDetail, setOpenBillDetail] = useState<any | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const {
    posUser, syncData, deviceName,
    saleMode, showMenuPanel, showBillsPanel, showJetonsPanel, isTableBill,
    searchMenu, setSearchMenu, selectedGroupSid, setSelectedGroupSid,
    filteredMenus, addMenuItem, billItems,
    selectedRoomSid, setSelectedRoomSid,
    currentTableName,
    filteredTables, getTableBill, handleTableClick, handleBackToTables,
    searchBills, setSearchBills,
    filteredBills, billsFilter, setBillsFilter, billsCounts,
    handleSwitchMode, handleLogout, router,
    pendingSales,
  } = sale

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

  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))
  const timeStr = now ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}` : "--:--"

  const isDancerMode = syncData.isDancerEnabled === 1
  const navItems = [
    { key: "tables", icon: LayoutGrid, label: "Ширээ", mode: "tables" as const, active: saleMode === "tables" || isTableBill || saleMode === "menu" },
    { key: "bills", icon: FileText, label: "Тооцоо", mode: "bills" as const, active: saleMode === "bills" },
    ...(isDancerMode ? [{ key: "jetons", icon: Coins, label: "Жетон", mode: "jetons" as const, active: showJetonsPanel }] : []),
  ]

  const toolItems = [
    { key: "report", icon: BarChart3, label: "Тайлан", onClick: () => router.push("/report") },
    { key: "sync", icon: Download, label: "Татах", onClick: () => router.push("/sync") },
    { key: "upload", icon: Upload, label: "Илгээх", onClick: () => router.push("/upload") },
  ]

  return (
    <div className="flex h-full bg-background">
      {/* ═══════════════ Left Rail ═══════════════ */}
      <aside className="w-[80px] shrink-0 flex flex-col items-center py-4 gap-3 bg-gradient-to-b from-card to-card/95 border-r border-border/60">
        <div className="mono-mark scale-[0.85]">
          <span className="relative z-10 text-base">F</span>
        </div>
        <div className="w-9 h-px bg-border/60 my-1" />

        <nav className="flex flex-col items-center gap-1.5 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => handleSwitchMode(item.mode)}
                className={`group relative w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                  item.active
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-primary -ml-2" />
                )}
                <Icon className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          {toolItems.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={t.onClick}
                className="w-full h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title={t.label}
              >
                <Icon className="h-[16px] w-[16px]" />
                <span className="text-[9px] leading-none">{t.label}</span>
              </button>
            )
          })}
        </div>

        <div className="w-9 h-px bg-border/60 my-1" />

        {/* User popover */}
        <Popover>
          <PopoverTrigger
            render={(props) => (
              <button
                {...props}
                className="group w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 hover:from-primary/30 hover:to-primary/10 transition-all relative"
                title={`${posUser?.name} · Цэс`}
              >
                <span className="text-sm font-bold text-primary">
                  {(posUser?.name || "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
              </button>
            )}
          />
          <PopoverContent side="right" align="end" sideOffset={12} className="w-72 p-0 overflow-hidden">
            <div className="px-4 py-3.5 bg-gradient-to-br from-primary/[0.06] via-card to-card border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/10 text-primary text-sm font-bold ring-1 ring-primary/15">
                  {(posUser?.name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{posUser?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{deviceName}</div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 space-y-2.5 border-b border-border/60">
              {cashSession ? (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="pill pill-success">
                      <LockOpen className="h-3 w-3" />
                      Касс нээлттэй
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Нээсэн
                      </div>
                      <div className="font-medium tabular mt-0.5">{cashSession.openedAt}</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        Эхлэх
                      </div>
                      <div className="font-bold text-primary tabular mt-0.5">{toMoney(cashSession.openingAmount)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <span className="pill pill-warn">
                    <Lock className="h-3 w-3" />
                    Касс хаалттай
                  </span>
                </div>
              )}
            </div>

            <div className="p-2 space-y-1">
              <button
                onClick={() => router.push("/cash")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted text-foreground transition-colors text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {cashSession ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                </div>
                <span className="flex-1 font-medium">{cashSession ? "Касс хаах" : "Касс нээх"}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 text-foreground hover:text-destructive transition-colors text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1 font-medium">Системээс гарах</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </aside>

      {/* ═══════════════ Main column ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border/60 bg-card/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="min-w-0 flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>POS</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium">
                    {showJetonsPanel ? "Жетон" : showBillsPanel ? "Тооцооны хуудас" : showMenuPanel ? (currentTableName || "Цэс") : "Ширээ"}
                  </span>
                </div>
                <h1 className="text-xl font-bold tracking-tight leading-tight mt-0.5">
                  {showJetonsPanel ? "Жетоны бүртгэл" :
                   showBillsPanel ? "Бүх тооцоо" :
                   showMenuPanel ? (isTableBill ? `${currentTableName} — Захиалга` : "Хурдан захиалга") :
                   "Ширээ удирдлага"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 mr-3">
                <KpiBadge label="Өнөөдөр" value={toMoney(kpis.revenue)} icon={<ReceiptText className="h-3.5 w-3.5" />} accent="primary" />
                <KpiBadge label="Гүйлгээ" value={`${kpis.count}`} icon={<Sparkles className="h-3.5 w-3.5" />} accent="emerald" />
                <KpiBadge label="Ширээ" value={`${kpis.occupied}/${kpis.totalTables}`} icon={<Users className="h-3.5 w-3.5" />} accent="amber" />
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl bg-muted/40 border border-border/60 text-sm tabular">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {timeStr}
              </div>

              <button
                title="Тохиргоо"
                onClick={() => router.push("/sync")}
                className="h-9 w-9 rounded-xl border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showMenuPanel && (
            <div className="px-5 pb-3 space-y-2.5">
              <div className="flex gap-2">
                {isTableBill && (
                  <button
                    onClick={handleBackToTables}
                    className="h-10 px-3 rounded-xl border border-border/60 bg-card hover:bg-muted text-sm font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Ширээ
                  </button>
                )}
                {isTableBill && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 h-10">
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
                    className="pl-10 h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 overflow-x-auto py-1.5 px-0.5 slim-scroll">
                <MenuCategoryTile
                  active={selectedGroupSid === null}
                  onClick={() => setSelectedGroupSid(null)}
                  label="Бүгд"
                  icon={<LayoutGrid className="h-[18px] w-[18px]" />}
                  count={filteredMenus.length}
                />
                {syncData.menuGroups.map((group: any, i: number) => (
                  <MenuCategoryTile
                    key={group.sid}
                    active={selectedGroupSid === group.sid}
                    onClick={() => setSelectedGroupSid(group.sid)}
                    label={group.name}
                    icon={group.iconName ? <LucideIcon name={group.iconName} className="h-[18px] w-[18px]" /> : <Coins className="h-[18px] w-[18px]" />}
                    accentIndex={i}
                  />
                ))}
              </div>
            </div>
          )}

          {saleMode === "tables" && !isTableBill && (
            <div className="px-5 pt-1 pb-4">
              <div className="flex gap-2.5 overflow-x-auto py-1.5 px-0.5 slim-scroll">
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
            </div>
          )}

          {showBillsPanel && (
            <div className="px-5 pb-3 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Тооцоо хайх..."
                  value={searchBills}
                  onChange={(e) => setSearchBills(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-0.5 w-fit">
                <BillsFilterChip active={billsFilter === "all"} onClick={() => setBillsFilter("all")} label="Бүгд" count={billsCounts.all} />
                <BillsFilterChip active={billsFilter === "unsent"} onClick={() => setBillsFilter("unsent")} label="Илгээгээгүй" count={billsCounts.unsent} accent="amber" />
                <BillsFilterChip active={billsFilter === "sent"} onClick={() => setBillsFilter("sent")} label="Илгээсэн" count={billsCounts.sent} accent="emerald" />
              </div>
            </div>
          )}
        </header>

        {/* ═══ Content ═══ */}
        <div className={`flex-1 min-h-0 ${showJetonsPanel ? "overflow-hidden pt-4 bg-muted/15" : "overflow-y-auto p-5 slim-scroll bg-muted/15"}`}>
          {showJetonsPanel ? (
            <JetonsPanel sale={sale} />
          ) : showMenuPanel ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 content-start">
              {filteredMenus.map((menu: any) => {
                const inBill = billItems.find(item => item.menuSid === menu.sid && !item.isCancelled)
                return (
                  <button
                    key={menu.sid}
                    onClick={() => addMenuItem(menu)}
                    className={`group relative text-left rounded-2xl overflow-hidden bg-card transition-all duration-200 active:scale-[0.97] flex flex-col h-full ${
                      inBill
                        ? "ring-2 ring-primary shadow-[0_12px_30px_-10px_color-mix(in_oklch,var(--primary)_50%,transparent)]"
                        : "ring-1 ring-border/60 hover:ring-primary/40 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_color-mix(in_oklch,var(--foreground)_18%,transparent)]"
                    }`}
                  >
                    {inBill && (
                      <div className="absolute top-2.5 right-2.5 z-20 flex h-7 min-w-7 px-2 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold tabular shadow-lg ring-2 ring-card">
                        ×{inBill.quantity}
                      </div>
                    )}

                    <div className="aspect-[4/3] w-full overflow-hidden relative shrink-0">
                      {menu.imageCode ? (
                        <img
                          src={getMenuImageSrc(menu.imageCode) || ''}
                          alt={menu.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                        className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 via-card to-amber-500/10 px-3"
                        style={{ display: menu.imageCode ? 'none' : 'flex' }}
                      >
                        <span className="text-5xl font-black text-primary/30 leading-none truncate select-none">
                          {(menu.name || "?").trim().slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 px-3 py-2.5 flex flex-col justify-center gap-1.5">
                      <div className="font-semibold text-sm leading-snug line-clamp-2">{menu.name}</div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-bold tabular text-primary leading-none">
                          {toMoney(menu.price || 0)}
                        </span>
                        <span className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-base font-bold transition-colors ${
                          inBill
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/70 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                        }`}>
                          +
                        </span>
                      </div>
                    </div>
                  </button>
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
            <div className="space-y-2 content-start">
              {filteredBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-3">
                    <FileText className="h-7 w-7 opacity-40" />
                  </div>
                  <p className="text-sm">Тооцоо олдсонгүй</p>
                </div>
              ) : (
                filteredBills.map((bill) => {
                  const activeItems = bill.items.filter((i: any) => !i.isCancelled)
                  const itemCount = activeItems.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
                  return (
                    <button
                      key={bill.id}
                      onClick={() => setOpenBillDetail(bill)}
                      className="surface-1 hover:shadow-md hover:border-primary/40 transition-all p-4 w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          bill.uploaded ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                        }`}>
                          <ReceiptText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold tabular">{toMoney(bill.total)}</span>
                            <span className="text-sm text-muted-foreground">·</span>
                            <span className="text-sm text-muted-foreground">{itemCount} зүйл</span>
                            {bill.uploaded ? (
                              <span className="pill pill-success">Илгээсэн</span>
                            ) : (
                              <span className="pill pill-warn">Илгээгээгүй</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1.5 truncate">
                            {activeItems.map((i: any) => i.name).join(", ")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {new Date(bill.createdAt).toLocaleString("mn-MN")}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
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
                    className={`group relative aspect-square rounded-2xl overflow-hidden transition-all active:scale-[0.96] flex flex-col bg-card ${
                      isOccupied
                        ? "ring-2 ring-primary/70 shadow-[0_10px_28px_-14px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
                        : "border border-border/60 hover:border-primary/40 hover:shadow-[0_8px_20px_-12px_color-mix(in_oklch,var(--foreground)_15%,transparent)]"
                    }`}
                  >
                    <div className={`h-1.5 w-full ${
                      isOccupied
                        ? "bg-gradient-to-r from-primary via-primary to-primary/70"
                        : "bg-gradient-to-r from-emerald-500/70 via-emerald-500/40 to-emerald-500/10"
                    }`} />
                    {isOccupied && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent pointer-events-none" />
                    )}

                    <div className="relative px-2.5 pt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                        isOccupied ? "text-primary" : "text-emerald-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isOccupied ? "bg-primary animate-pulse" : "bg-emerald-500"
                        }`} />
                        {isOccupied ? "Захиалгатай" : "Чөлөөтэй"}
                      </span>
                    </div>

                    <div className="relative flex-1 flex items-center justify-center px-2 min-h-0">
                      <div className={`font-bold tracking-tight text-center leading-none line-clamp-2 break-words text-foreground ${nameSizeClass}`}>
                        {table.name}
                      </div>
                    </div>

                    <div className="relative px-2.5 pb-2 min-h-[24px] flex items-center justify-center">
                      {isOccupied ? (
                        <div className="text-sm font-bold tabular text-primary leading-none truncate w-full text-center">
                          {toMoney(bill.totalAmount)}
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BillPanel sale={sale} />

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

const ACCENTS = [
  { bg: "bg-violet-500/10", text: "text-violet-600", ring: "ring-violet-500/30", grad: "from-violet-500/15 to-violet-500/0" },
  { bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "ring-emerald-500/30", grad: "from-emerald-500/15 to-emerald-500/0" },
  { bg: "bg-amber-500/10", text: "text-amber-600", ring: "ring-amber-500/30", grad: "from-amber-500/15 to-amber-500/0" },
  { bg: "bg-sky-500/10", text: "text-sky-600", ring: "ring-sky-500/30", grad: "from-sky-500/15 to-sky-500/0" },
  { bg: "bg-rose-500/10", text: "text-rose-600", ring: "ring-rose-500/30", grad: "from-rose-500/15 to-rose-500/0" },
  { bg: "bg-orange-500/10", text: "text-orange-600", ring: "ring-orange-500/30", grad: "from-orange-500/15 to-orange-500/0" },
  { bg: "bg-cyan-500/10", text: "text-cyan-600", ring: "ring-cyan-500/30", grad: "from-cyan-500/15 to-cyan-500/0" },
  { bg: "bg-indigo-500/10", text: "text-indigo-600", ring: "ring-indigo-500/30", grad: "from-indigo-500/15 to-indigo-500/0" },
  { bg: "bg-pink-500/10", text: "text-pink-600", ring: "ring-pink-500/30", grad: "from-pink-500/15 to-pink-500/0" },
]

function MenuCategoryTile({
  active, onClick, label, icon, count, accentIndex = -1,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
  count?: number
  accentIndex?: number
}) {
  const acc = accentIndex >= 0 ? ACCENTS[accentIndex % ACCENTS.length] : null
  return (
    <button
      onClick={onClick}
      className={`group shrink-0 relative h-11 rounded-xl flex items-center gap-2 pl-2 pr-3 transition-all overflow-hidden border ${
        active
          ? `bg-card border-primary/60 ring-2 ring-primary/25 shadow-[0_4px_12px_-6px_color-mix(in_oklch,var(--foreground)_18%,transparent)]`
          : "bg-card border-border/60 hover:border-border hover:bg-muted/40"
      }`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
        active
          ? `${acc?.bg ?? "bg-primary/15"} ${acc?.text ?? "text-primary"}`
          : "bg-muted text-muted-foreground group-hover:bg-muted/70"
      }`}>
        <span className="[&>svg]:h-[15px] [&>svg]:w-[15px]">{icon}</span>
      </div>
      <div className="text-left min-w-0 flex items-baseline gap-1.5">
        <span className={`text-sm font-semibold truncate max-w-[140px] ${active ? "text-foreground" : "text-foreground/85"}`}>
          {label}
        </span>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground tabular">{count}</span>
        )}
      </div>
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
  const ratio = total > 0 ? occupied / total : 0
  return (
    <button
      onClick={onClick}
      className={`group shrink-0 relative h-[72px] min-w-[150px] rounded-2xl px-4 pt-3 pb-2.5 flex flex-col justify-between transition-all overflow-hidden bg-card border ${
        active ? "border-primary/60 ring-2 ring-primary/30" : "border-border/60 hover:border-border hover:bg-muted/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${
          ratio >= 0.8 ? "bg-rose-500" : ratio >= 0.4 ? "bg-amber-500" : "bg-emerald-500"
        }`} />
        <span className="text-sm font-semibold truncate text-foreground/90">
          {name}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1 tabular">
          <span className="text-base font-bold leading-none text-foreground">{occupied}</span>
          <span className="text-xs text-muted-foreground">/ {total} ширээ</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(total, 5) }).map((_, i) => (
            <span
              key={i}
              className={`h-1 w-1.5 rounded-sm ${i < occupied ? "bg-foreground/50" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>
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
      ? "bg-amber-500 text-white shadow-[0_4px_12px_-4px_color-mix(in_oklch,#f59e0b_50%,transparent)]"
      : active && accent === "emerald"
        ? "bg-emerald-500 text-white shadow-[0_4px_12px_-4px_color-mix(in_oklch,#10b981_50%,transparent)]"
        : active
          ? "bg-foreground text-background shadow-[0_4px_12px_-4px_color-mix(in_oklch,var(--foreground)_30%,transparent)]"
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
