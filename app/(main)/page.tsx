"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePosStore } from "@/lib/store"

export default function PosDesktopPage() {
  const router = useRouter()

  useEffect(() => {
    // Restore session from localStorage
    usePosStore.getState().restorePosSession()
    
    const state = usePosStore.getState()
    if (!state.isPaired) {
      router.replace("/login")
    } else if (!state.posUser) {
      router.replace("/login")
    } else if (!state.cashSession) {
      router.replace("/cash")
    } else {
      router.replace("/sale")
    }
  }, [router])

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground">Уншиж байна...</div>
    </div>
  )
}
