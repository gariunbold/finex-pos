export function toMoney(value: any): string {
  const num = Number(String(value).replace(/,/g, ''))
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function toMoney0(value: any): string {
  const num = Number(String(value).replace(/,/g, ''))
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function toQty(value: any): string {
  const num = Number(String(value).replace(/,/g, ''))
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function toNumber(value: any): number {
  const num = Number(String(value).replace(/[,\s]/g, ''))
  return isNaN(num) ? 0 : num
}

export function dateToStr(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export function datetimeToStr(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${day} ${h}:${min}:${s}`
}

export function strToDate(str: string): Date | null {
  if (!str) return null
  const d = new Date(str.replace(/\./g, '-'))
  return isNaN(d.getTime()) ? null : d
}

export function today(): string {
  return dateToStr(new Date())
}
