"use client"

import { Suspense, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AppHeader } from "@/components/app-header"

export default function PosDesktopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hideHeader = pathname === "/login" || pathname === "/"

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
      const isTauri = !!window.__TAURI__
      if (!isTauri) {
        console.warn("POS Desktop module should run in Tauri app")
      }
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {!hideHeader && (
        <Suspense fallback={<div className="h-14 shrink-0" />}>
          <AppHeader />
        </Suspense>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
