"use client"

import { useEffect, useState } from "react"
import { useAlertStore } from "@/lib/store"

export function AppUpdater() {
  const [status, setStatus] = useState("")

  useEffect(() => {
    checkForUpdate()
  }, [])

  async function checkForUpdate() {
    try {
      const { check } = await import("@tauri-apps/plugin-updater")
      const { relaunch } = await import("@tauri-apps/plugin-process")

      const update = await check()
      if (!update) return

      const confirmed = await useAlertStore.getState().confirm(
        "Шинэчлэлт байна",
        `Шинэ хувилбар ${update.version} бэлэн байна. Шинэчлэх үү?`
      )
      if (!confirmed) return

      useAlertStore.getState().showLoading("Шинэчлэлт татаж байна...")

      await update.downloadAndInstall((progress) => {
        if (progress.event === "Started" && progress.data.contentLength) {
          setStatus(`0 / ${Math.round(progress.data.contentLength / 1024 / 1024)} MB`)
        } else if (progress.event === "Progress") {
          setStatus(`Татаж байна...`)
        } else if (progress.event === "Finished") {
          setStatus("Суулгаж байна...")
        }
      })

      useAlertStore.getState().hideLoading()

      await useAlertStore.getState().confirm(
        "Шинэчлэлт дууслаа",
        "Апп дахин эхлүүлэх шаардлагатай."
      )

      await relaunch()
    } catch {
      // Tauri биш орчинд (browser) эсвэл алдаа гарвал чимээгүй алгасна
      useAlertStore.getState().hideLoading()
    }
  }

  return null
}
