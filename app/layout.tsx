"use client"

import "./globals.css"

import { useEffect } from "react"
import { Roboto } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AppAlert } from "@/components/app-alert"
import { AppUpdater } from "@/components/app-updater"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useThemeStore } from "@/lib/store"

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initTheme = useThemeStore(s => s.initTheme)

  useEffect(() => { initTheme() }, [initTheme])

  return (
    <html lang="mn" suppressHydrationWarning className={roboto.variable}>
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
