"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore, useAlertStore } from "@/lib/store"
import { toMoney } from "@/lib/format"
import {
  Banknote, Clock, LogOut, LockOpen, Lock, ArrowLeft, ArrowRight,
  Coins, Delete, User,
} from "lucide-react"

export default function PosCashPage() {
  const router = useRouter()
  const { isPaired, posUser, cashSession, deviceName, storeName, openCash, closeCash, posLogout } = usePosStore()
  const { alertError, confirm, showLoading, hideLoading, toastSuccess } = useAlertStore()

  const [amount, setAmount] = useState("")

  useEffect(() => {
    if (!isPaired || !posUser) router.replace("/login")
  }, [isPaired, posUser, router])

  const pushDigit = (d: string) => setAmount((v) => (v === "0" ? d : (v + d).slice(0, 12)))
  const pushDot = () => setAmount((v) => (v.includes(".") ? v : (v || "0") + "."))
  const backspace = () => setAmount((v) => v.slice(0, -1))
  const clear = () => setAmount("")
  const addThousand = (n: number) => setAmount((v) => String((parseFloat(v) || 0) + n))

  const handleOpenCash = async () => {
    const openingAmount = parseFloat(amount)
    if (isNaN(openingAmount) || openingAmount < 0) return alertError("Эхлэх мөнгөн дүн буруу байна")

    const confirmed = await confirm("Касс нээх", `Эхлэх мөнгөн дүн: ${toMoney(openingAmount)}`)
    if (!confirmed) return

    showLoading("Касс нээж байна...")
    try {
      const success = await openCash(openingAmount)
      hideLoading()
      if (success) {
        toastSuccess("Касс амжилттай нээгдлээ")
        router.replace("/sale")
      } else alertError("Касс нээх амжилтгүй", "Дахин оролдоно уу")
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleCloseCash = async () => {
    const closingAmount = parseFloat(amount)
    if (isNaN(closingAmount) || closingAmount < 0) return alertError("Төгсгөх мөнгөн дүн буруу байна")

    const confirmed = await confirm(
      "Касс хаах",
      `Төгсгөх мөнгөн дүн: ${toMoney(closingAmount)}\n\nБиллийн мөнгө, төлөлт зэргийг шалгасан эсэхээ баталгаажуулна уу.`
    )
    if (!confirmed) return

    showLoading("Касс хааж байна...")
    try {
      const success = await closeCash(closingAmount)
      hideLoading()
      if (success) {
        toastSuccess("Касс амжилттай хаагдлаа")
        posLogout()
        router.replace("/login")
      } else alertError("Касс хаах амжилтгүй", "Дахин оролдоно уу")
    } catch (e: any) {
      hideLoading()
      alertError("Алдаа гарлаа", e.message)
    }
  }

  const handleLogout = async () => {
    const confirmed = await confirm("Гарах", "Та системээс гарах уу?")
    if (confirmed) {
      posLogout()
      router.replace("/login")
    }
  }

  const isCashOpen = !!cashSession
  const amountNum = parseFloat(amount) || 0
  const formatted = amount
    ? amount.split(".").map((part, i) => i === 0 ? Number(part).toLocaleString("mn-MN") : part).join(".")
    : "0"

  return (
    <div className="surface-page h-full flex flex-col">
      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="mono-mark scale-[0.85] origin-left">
            <span className="relative z-10 text-lg">F</span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-none">{deviceName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {storeName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="pill">
            <User className="h-3.5 w-3.5" />
            {posUser?.name}
          </span>
          <button
            onClick={handleLogout}
            title="Гарах"
            className="h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Center grid */}
      <main className="relative z-10 flex-1 overflow-hidden flex items-center justify-center p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-6 w-full max-w-[820px] fade-up">
          {/* Display + session */}
          <div className="surface-2 p-6 sm:p-8 flex flex-col gap-5 min-w-0">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isCashOpen ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}>
                {isCashOpen ? <Lock className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight leading-none">
                    {isCashOpen ? "Касс хаах" : "Касс нээх"}
                  </h1>
                  {isCashOpen && <span className="pill pill-warn">Нээлттэй</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  <Coins className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  Кассын мөнгөн бэлэн дүнг оруулна уу
                </p>
              </div>
            </div>

            {/* Amount display */}
            <div className="rounded-2xl bg-gradient-to-br from-muted/60 via-muted/30 to-transparent border border-border/60 px-5 sm:px-8 py-6 sm:py-8 min-h-[160px] flex flex-col justify-center">
              <div className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">
                {isCashOpen ? "Төгсгөх дүн" : "Эхлэх дүн"}
              </div>
              <div className="flex items-baseline gap-2 tabular">
                <span className={`text-5xl sm:text-6xl font-bold tracking-tight leading-none truncate ${
                  amount ? "text-foreground" : "text-muted-foreground/40"
                }`}>
                  {formatted}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">₮</span>
              </div>
              {isCashOpen && cashSession && (
                <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Нээсэн цаг
                    </div>
                    <div className="font-medium mt-0.5">{cashSession.openedAt}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Banknote className="h-3 w-3" /> Эхлэх дүн
                    </div>
                    <div className="font-bold text-primary tabular mt-0.5">{toMoney(cashSession.openingAmount)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[10000, 50000, 100000, 500000].map((v) => (
                <button
                  key={v}
                  onClick={() => addThousand(v)}
                  className="h-10 rounded-xl bg-muted/50 hover:bg-muted border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors tabular"
                >
                  +{v.toLocaleString("mn-MN")}
                </button>
              ))}
            </div>

            {/* Action */}
            <div className="flex items-center gap-2 mt-auto">
              {isCashOpen ? (
                <>
                  <button
                    onClick={handleCloseCash}
                    disabled={!amountNum}
                    className="sheen group flex-1 h-14 rounded-2xl bg-destructive text-white font-semibold text-base flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-px transition-all disabled:opacity-40"
                  >
                    <Lock className="h-[18px] w-[18px]" />
                    Касс хаах
                    <ArrowRight className="h-[18px] w-[18px] ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => router.replace("/sale")}
                    className="h-14 px-5 rounded-2xl bg-card border border-border hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Буцах
                  </button>
                </>
              ) : (
                <button
                  onClick={handleOpenCash}
                  disabled={!amountNum && amount !== "0"}
                  className="sheen group flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-px transition-all disabled:opacity-40"
                >
                  <LockOpen className="h-[18px] w-[18px]" />
                  Касс нээх
                  <ArrowRight className="h-[18px] w-[18px] ml-1 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Keypad */}
          <div className="surface-2 p-5 sm:p-6">
            <div className="keypad-grid w-full sm:w-[280px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button key={d} className="keypad-btn tabular" onClick={() => pushDigit(d)}>
                  {d}
                </button>
              ))}
              <button className="keypad-btn accent" onClick={clear} title="Цэвэрлэх">
                <span className="text-sm font-semibold">C</span>
              </button>
              <button className="keypad-btn tabular" onClick={() => pushDigit("0")}>
                0
              </button>
              <button className="keypad-btn" onClick={backspace} title="Устгах">
                <Delete className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={pushDot}
              className="mt-2 w-full sm:w-[280px] h-10 rounded-xl bg-muted/50 hover:bg-muted border border-border/60 text-base font-bold text-muted-foreground tabular transition-colors"
            >
              .
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
