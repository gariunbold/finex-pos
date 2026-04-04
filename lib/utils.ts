import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === ''
}

export function isNotEmpty(value: any): boolean {
  return !isEmpty(value)
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function fillZero(num: number, length: number): string {
  return String(num).padStart(length, '0')
}

export function codeName(item: any): string {
  if (!item) return ''
  return `${item.code || ''} - ${item.name || ''}`
}
