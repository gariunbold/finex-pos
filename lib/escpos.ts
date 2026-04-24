// ═══════════════════════════════════════════════════════════
//  ESC/POS receipt builder for thermal printers (e.g. GP-C58)
//  Encoding: CP1251 (Windows Cyrillic) — covers Mongolian Cyrillic
//  with substitutions for letters not in CP1251 (Ө, ө, Ү, ү)
// ═══════════════════════════════════════════════════════════

const ESC = 0x1B
const GS = 0x1D
const LF = 0x0A

// Receipt data structure
export interface ReceiptItem {
  name: string
  price: number
  quantity: number
  amount: number
  dancerName?: string
}
export interface ReceiptInput {
  storeName: string
  dateStr: string
  tableName?: string
  cashierName?: string
  items: ReceiptItem[]
  total: number
  ebarimt?: boolean | null    // true=Е-баримт, false=Е-баримтгүй, null/undefined=пүнхэн
  footer?: string             // default: "Баярлалаа!"
  width?: number              // тэмдэгтийн өргөн (default 32 — 58mm GP-C58)
}

export function buildReceipt(input: ReceiptInput): Uint8Array {
  const out: number[] = []
  const width = input.width ?? 32

  // ── Init + codepage ──
  out.push(ESC, 0x40)             // ESC @  — printer reset
  out.push(ESC, 0x74, 17)         // ESC t 17 — Codepage CP1251 (Cyrillic)

  // ── Header (centered, bold, larger) ──
  alignCenter(out)
  bold(out, true)
  size(out, 1, 1)                 // 2x height
  pushText(out, input.storeName)
  out.push(LF)
  size(out, 0, 0)
  bold(out, false)
  pushText(out, input.dateStr)
  out.push(LF)

  if (input.tableName) {
    bold(out, true)
    pushText(out, input.tableName)
    bold(out, false)
    out.push(LF)
  }

  if (input.cashierName) {
    pushText(out, "Кассчин: " + input.cashierName)
    out.push(LF)
  }

  alignLeft(out)
  separator(out, width)

  // ── Items ──
  input.items.forEach((item, i) => {
    // 1. <name>
    pushText(out, `${i + 1}. ${item.name}`)
    out.push(LF)

    if (item.dancerName) {
      pushText(out, `   ⇢ ${item.dancerName}`)
      out.push(LF)
    }

    // qty x price                     amount
    const left = `   ${formatMoney(item.price)} x ${item.quantity}`
    const right = formatMoney(item.amount)
    pushText(out, padRow(left, right, width))
    out.push(LF)
  })

  separator(out, width)

  // ── Total ──
  bold(out, true)
  size(out, 0, 1)                 // double height
  pushText(out, padRow("НИЙТ:", formatMoney(input.total), Math.floor(width / 2)))
  size(out, 0, 0)
  bold(out, false)
  out.push(LF)

  // ── E-barimt block ──
  if (input.ebarimt === true) {
    separator(out, width)
    alignCenter(out)
    bold(out, true)
    pushText(out, "Е-БАРИМТ")
    bold(out, false)
    out.push(LF)
    pushText(out, `ДДТД: ${Date.now()}`)
    out.push(LF)
    pushText(out, `Огноо: ${input.dateStr}`)
    out.push(LF)
    alignLeft(out)
  } else if (input.ebarimt === false) {
    separator(out, width)
    alignCenter(out)
    pushText(out, "Е-баримтгүй")
    out.push(LF)
    alignLeft(out)
  }

  // ── Footer ──
  alignCenter(out)
  out.push(LF)
  pushText(out, input.footer ?? "Баярлалаа!")
  out.push(LF)
  alignLeft(out)

  // ── Feed + cut ──
  out.push(ESC, 0x64, 4)          // ESC d 4 — feed 4 lines
  out.push(GS, 0x56, 0x00)        // GS V 0 — full cut

  return new Uint8Array(out)
}

// ─── Helpers ───────────────────────────────────────────────

function alignLeft(arr: number[])   { arr.push(ESC, 0x61, 0) }
function alignCenter(arr: number[]) { arr.push(ESC, 0x61, 1) }
function bold(arr: number[], on: boolean) { arr.push(ESC, 0x45, on ? 1 : 0) }
function size(arr: number[], w: number, h: number) {
  // ESC ! n  — w bit 4 (16=2x), h bit 0 (1=2x). 0..15 valid combinations.
  // Simpler: GS ! n where n = w<<4 | h (0..7 each)
  arr.push(GS, 0x21, ((w & 0x07) << 4) | (h & 0x07))
}

function separator(arr: number[], width: number) {
  pushText(arr, "-".repeat(width))
  arr.push(LF)
}

function padRow(left: string, right: string, width: number): string {
  const total = width
  const space = total - left.length - right.length
  if (space < 1) return left + " " + right
  return left + " ".repeat(space) + right
}

function formatMoney(n: number): string {
  const v = Math.round(n || 0)
  return v.toLocaleString("en-US")
}

// Push UTF-8 string as CP1251 bytes
function pushText(arr: number[], text: string) {
  for (const ch of text) {
    const bytes = utf8CharToCp1251(ch)
    for (const b of bytes) arr.push(b)
  }
}

// UTF-8 char → CP1251 byte (with substitutions for Mongolian letters)
function utf8CharToCp1251(ch: string): number[] {
  const code = ch.charCodeAt(0)

  // ASCII
  if (code < 128) return [code]

  // CP1251 explicit mappings
  const map: Record<number, number> = {
    0x0401: 0xA8, // Ё
    0x0451: 0xB8, // ё
    0x0490: 0xA5, // Ґ
    0x0491: 0xB4, // ґ
    0x0402: 0x80, // Ђ
    0x0452: 0x90, // ђ
  }
  if (map[code] !== undefined) return [map[code]]

  // Cyrillic А-я block (0x0410..0x044F → 0xC0..0xFF)
  if (code >= 0x0410 && code <= 0x044F) return [code - 0x0410 + 0xC0]

  // Mongolian Cyrillic — substitutions (CP1251-д байхгүй)
  if (code === 0x04E8) return [0xCE]                    // Ө → О
  if (code === 0x04E9) return [0xEE]                    // ө → о
  if (code === 0x04AE) return [0xD3]                    // Ү → У
  if (code === 0x04AF) return [0xF3]                    // ү → у

  // Common punctuation
  if (code === 0x2014) return [0x97]                    // — em-dash
  if (code === 0x2013) return [0x96]                    // – en-dash
  if (code === 0x2018) return [0x91]                    // '
  if (code === 0x2019) return [0x92]                    // '
  if (code === 0x201C) return [0x93]                    // "
  if (code === 0x201D) return [0x94]                    // "
  if (code === 0x2026) return [0x85]                    // …
  if (code === 0x00B0) return [0xB0]                    // °
  if (code === 0x20AC) return [0x88]                    // €
  if (code === 0x21E2) return [0x3E]                    // ⇢ → >
  if (code === 0x2192) return [0x3E]                    // → → >

  // Fallback
  return [0x3F] // '?'
}

// ═══════════════════════════════════════════════════════════
//  Tauri integration — Rust командаар хэвлэх
// ═══════════════════════════════════════════════════════════

const PRINTER_NAME_KEY = "pos-printer-name"

export function getSavedPrinterName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(PRINTER_NAME_KEY)
}
export function setSavedPrinterName(name: string | null) {
  if (typeof window === "undefined") return
  if (name) localStorage.setItem(PRINTER_NAME_KEY, name)
  else localStorage.removeItem(PRINTER_NAME_KEY)
}

export function isTauri(): boolean {
  if (typeof window === "undefined") return false
  return !!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__
}

export async function printReceipt(input: ReceiptInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTauri()) return { ok: false, error: "Browser mode-д ESC/POS дэмжихгүй" }
  try {
    const { invoke } = await import("@tauri-apps/api/core")
    const bytes = buildReceipt(input)
    await invoke("print_raw_to_printer", {
      printerName: getSavedPrinterName(),
      bytes: Array.from(bytes),
    })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}

export async function listPrinters(): Promise<Array<{ name: string; is_default: boolean }>> {
  if (!isTauri()) return []
  try {
    const { invoke } = await import("@tauri-apps/api/core")
    return await invoke<Array<{ name: string; is_default: boolean }>>("list_printers")
  } catch {
    return []
  }
}

export async function getDefaultPrinter(): Promise<string | null> {
  if (!isTauri()) return null
  try {
    const { invoke } = await import("@tauri-apps/api/core")
    return await invoke<string | null>("get_default_printer_name")
  } catch {
    return null
  }
}
