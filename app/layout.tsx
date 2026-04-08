"use client"

import "./globals.css"

import { useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { AppAlert } from "@/components/app-alert"
import { AppUpdater } from "@/components/app-updater"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useThemeStore } from "@/lib/store"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initTheme = useThemeStore(s => s.initTheme)

  useEffect(() => { initTheme() }, [initTheme])

  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <title>Finex</title>
        <link rel="icon" href="/fav.png" type="image/png" />
      </head>
      <body>
        <TooltipProvider>
        {children}
        </TooltipProvider>
        <AppAlert />
        <AppUpdater />
        <Toaster position="bottom-right" duration={3000} richColors />
      </body>
    </html>
  )
}
