"use client"

import { useEffect } from "react"

export default function PosDesktopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Check if running in Tauri
    if (typeof window !== "undefined") {
      // @ts-ignore
      const isTauri = !!window.__TAURI__
      if (!isTauri) {
        console.warn("POS Desktop module should run in Tauri app")
      }
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  )
}
