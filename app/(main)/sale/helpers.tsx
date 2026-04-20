import { icons as lucideIcons, Banknote, CreditCard, QrCode, Building2, Wallet } from "lucide-react"

export const ASSET_THUMB_URL = "https://asset.app.mn/asset/thumb"

// ═══ Зургийн offline cache ═══
const IMAGE_CACHE_KEY = 'menu-image-cache'

export function getCachedImageMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}')
  } catch { return {} }
}

export function getMenuImageSrc(imageCode: string | null | undefined): string | null {
  if (!imageCode) return null
  const cache = getCachedImageMap()
  return cache[imageCode] || `${ASSET_THUMB_URL}/${imageCode}`
}

export async function cacheMenuImages(menus: any[]) {
  const codes = menus.map(m => m.imageCode).filter(Boolean) as string[]
  if (codes.length === 0) return

  const cache = getCachedImageMap()
  // Шинэ зургуудыг л татах
  const newCodes = codes.filter(code => !cache[code])
  if (newCodes.length === 0) return

  // Cache-д байхгүй хуучин code-уудыг устгах
  const validCodes = new Set(codes)
  for (const key of Object.keys(cache)) {
    if (!validCodes.has(key)) delete cache[key]
  }

  // Зураг бүрийг татаж base64 болгох
  await Promise.all(newCodes.map(async (code) => {
    try {
      const res = await fetch(`${ASSET_THUMB_URL}/${code}`)
      if (!res.ok) return
      const blob = await res.blob()
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      cache[code] = dataUrl
    } catch {}
  }))

  localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
}

// Dynamic Lucide icon renderer
export function LucideIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null
  // lucide icon нэрийг PascalCase-д хөрвүүлэх
  const pascalName = name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase())
  const IconComponent = (lucideIcons as any)[pascalName]
  if (!IconComponent) return null
  return <IconComponent className={className} />
}

export const TugrikIcon = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontWeight: 700, fontSize: '1.1em', lineHeight: 1 }}>₮</span>
)

export function getPaymentIcon(codeOrName: string) {
  const lower = (codeOrName || '').toLowerCase()
  if (lower.includes('cash') || lower.includes('бэлэн')) return Banknote
  if (lower.includes('card') || lower.includes('карт')) return CreditCard
  if (lower.includes('qr') || lower.includes('qpay')) return QrCode
  if (lower.includes('bank') || lower.includes('данс')) return Building2
  if (lower.includes('credit') || lower.includes('зээл')) return Wallet
  return TugrikIcon
}
