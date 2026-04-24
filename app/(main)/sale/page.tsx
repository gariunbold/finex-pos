"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toMoney } from "@/lib/format"
import {
  Search, Download, Upload, LogOut, LayoutGrid, ArrowLeft,
  Coffee, Users, BarChart3, FileText, Printer, Trash2, Coins,
} from "lucide-react"
import { LucideIcon, getMenuImageSrc } from "./helpers"
import { useSale } from "./use-sale"
import { BillPanel } from "./bill-panel"
import { JetonsPanel } from "./jetons-panel"
import { PaymentDialog, PrintPreviewDialog, DancerPickerDialog } from "./dialogs"

export default function PosSalePage() {
  const sale = useSale()

  const {
    posUser, syncData, deviceName,
    saleMode, showMenuPanel, showBillsPanel, showJetonsPanel, isTableBill,
    searchMenu, setSearchMenu, selectedGroupSid, setSelectedGroupSid,
    filteredMenus, addMenuItem, billItems,
    selectedRoomSid, setSelectedRoomSid,
    currentTableName,
    filteredTables, getTableBill, handleTableClick, handleBackToTables,
    searchBills, setSearchBills,
    filteredBills, handleDeleteSale, printClosedBill,
    handleSwitchMode, handleLogout, router,
  } = sale

  return (
    <div className="flex h-full bg-background">
      {/* ═══ Left Panel ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15">
                <Coffee className="h-[18px] w-[18px] text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                  {deviceName}
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Холбогдсон" />
                </div>
                <div className="text-sm text-muted-foreground leading-tight">{posUser?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-xl border bg-muted/40 p-0.5 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)]">
                <Button
                  variant={saleMode === "tables" || isTableBill || saleMode === "menu" ? "default" : "outline"}
                  className={saleMode === "tables" || isTableBill || saleMode === "menu" ? "" : "border-0 bg-transparent hover:bg-background"}
                  onClick={() => handleSwitchMode("tables")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Ширээ
                </Button>
                <Button
                  variant={saleMode === "bills" ? "default" : "outline"}
                  className={saleMode === "bills" ? "" : "border-0 bg-transparent hover:bg-background"}
                  onClick={() => handleSwitchMode("bills")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Тооцоо
                </Button>
                {syncData.isDancerEnabled === 1 && (
                  <Button
                    variant={showJetonsPanel ? "default" : "outline"}
                    className={showJetonsPanel ? "" : "border-0 bg-transparent hover:bg-background"}
                    onClick={() => handleSwitchMode("jetons")}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Жетон
                  </Button>
                )}
              </div>
              <Separator orientation="vertical" className="h-7 mx-1" />
              <Button variant="outline" size="icon" onClick={() => router.push("/report")} title="Тайлан">
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => router.push("/sync")} title="Өгөгдөл татах">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => router.push("/upload")} title="Өгөгдөл илгээх">
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} title="Гарах">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showMenuPanel && (
            <div className="px-4 pb-3 space-y-2.5">
              <div className="flex gap-2">
                {isTableBill && (
                  <Button variant="outline" onClick={handleBackToTables}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                {isTableBill && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{currentTableName}</span>
                  </div>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Цэс хайх..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-0.5 slim-scroll">
                <Button
                  variant={selectedGroupSid === null ? "default" : "outline"}
                  onClick={() => setSelectedGroupSid(null)}
                >
                  Бүгд
                </Button>
                {syncData.menuGroups.map((group: any) => (
                  <Button
                    key={group.sid}
                    variant={selectedGroupSid === group.sid ? "default" : "outline"}
                    onClick={() => setSelectedGroupSid(group.sid)}
                  >
                    {group.iconName && <LucideIcon name={group.iconName} className="h-4 w-4 mr-1.5" />}
                    {group.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {saleMode === "tables" && !isTableBill && (
            <div className="px-4 pb-3">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 slim-scroll">
                {syncData.rooms.map((room: any) => (
                  <Button
                    key={room.sid}
                    variant={selectedRoomSid === room.sid ? "default" : "outline"}
                    onClick={() => setSelectedRoomSid(room.sid)}
                  >
                    {room.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showBillsPanel && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Тооцоо хайх..."
                  value={searchBills}
                  onChange={(e) => setSearchBills(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 min-h-0 bg-muted/30 ${showJetonsPanel ? "overflow-hidden pt-4" : "overflow-y-auto p-4 slim-scroll"}`}>
          {showJetonsPanel ? (
            /* ═══ Jeton panel ═══ */
            <JetonsPanel sale={sale} />
          ) : showMenuPanel ? (
            /* ═══ Menu Grid ═══ */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 content-start">
              {filteredMenus.map((menu: any) => {
                const inBill = billItems.find(item => item.menuSid === menu.sid && !item.isCancelled)
                return (
                  <Card
                    key={menu.sid}
                    className={`group relative overflow-visible p-0 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
                      inBill
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => addMenuItem(menu)}
                  >
                    {inBill && (
                      <div className="absolute -top-2.5 -right-2.5 flex h-7 min-w-7 px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md z-10">
                        {inBill.quantity}
                      </div>
                    )}
                    <div className="aspect-[4/3] rounded-t-lg overflow-hidden bg-muted/50">
                      {menu.imageCode ? (
                        <img
                          src={getMenuImageSrc(menu.imageCode) || ''}
                          alt={menu.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center'); (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { className: 'text-2xl opacity-30', textContent: '🍽' })) }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl opacity-30">🍽</span>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="font-medium text-sm leading-snug truncate">{menu.name}</div>
                      <div className="text-sm font-semibold text-primary">{toMoney(menu.price || 0)}</div>
                    </div>
                  </Card>
                )
              })}
              {filteredMenus.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Search className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">Цэс олдсонгүй</p>
                </div>
              )}
            </div>
          ) : showBillsPanel ? (
            /* ═══ Тооцооны хуудас ═══ */
            <div className="space-y-2 content-start">
              {filteredBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">Тооцоо олдсонгүй</p>
                </div>
              ) : (
                filteredBills.map((sale) => {
                  const activeItems = sale.items.filter((i: any) => !i.isCancelled)
                  const itemCount = activeItems.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
                  return (
                    <Card key={sale.id} className="p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{toMoney(sale.total)}</span>
                              <span className="text-sm text-muted-foreground">·</span>
                              <span className="text-sm text-muted-foreground">{itemCount} зүйл</span>
                              {sale.uploaded ? (
                                <span className="text-sm text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">Илгээсэн</span>
                              ) : (
                                <span className="text-sm text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-md">Илгээгээгүй</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 truncate">
                              {activeItems.map((i: any) => i.name).join(", ")}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {new Date(sale.createdAt).toLocaleString("mn-MN")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            onClick={() => printClosedBill(sale)}
                            title="Хэвлэх"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeleteSale(sale.id)}
                            title="Устгах"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          ) : (
            /* ═══ Table Grid ═══ */
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 content-start">
              {filteredTables.map((table: any) => {
                const bill = getTableBill(table.sid)
                const isOccupied = !!bill
                return (
                  <Card
                    key={table.sid}
                    className={`p-4 cursor-pointer transition-all text-center hover:shadow-md active:scale-[0.98] ${
                      isOccupied
                        ? "border-primary bg-primary/8 hover:bg-primary/12 shadow-sm"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => handleTableClick(table)}
                  >
                    <div className={`font-semibold ${isOccupied ? "text-primary" : ""}`}>
                      {table.name}
                    </div>
                    {isOccupied ? (
                      <div className="text-sm text-primary font-bold mt-1.5">
                        {toMoney(bill.totalAmount)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground mt-1.5">Чөлөөтэй</div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Right Panel: Bill ═══ */}
      <BillPanel sale={sale} />

      {/* ═══ Dialogs ═══ */}
      <PaymentDialog sale={sale} />
      <PrintPreviewDialog sale={sale} />
      <DancerPickerDialog sale={sale} />
    </div>
  )
}
