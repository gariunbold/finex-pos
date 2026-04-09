"use client"

import { useEffect } from "react"
import { useAlertStore } from "@/lib/store"

// GitHub PAT (fine-grained, read-only contents, зөвхөн finex-pos repo)
const GH_TOKEN = "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"
const GH_REPO = "gariunbold/finex-pos"
const GH_API = `https://api.github.com/repos/${GH_REPO}/releases/latest`

export function AppUpdater() {
  useEffect(() => {
    const timer = setTimeout(() => checkForUpdate(), 3000)
    return () => clearTimeout(timer)
  }, [])

  return null
}

async function checkForUpdate() {
  try {
    if (typeof window === 'undefined' || !((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) return

    const { invoke } = await import("@tauri-apps/api/core")

    // 1. GitHub API-аас latest release авах
    const releaseJson = await invoke<string>("http_get", {
      url: GH_API,
      authToken: GH_TOKEN,
    })

    const release = JSON.parse(releaseJson)
    const latestVersion = release.tag_name?.replace(/^v/, "")
    if (!latestVersion) return

    // 2. Одоогийн version-тэй харьцуулах
    const { getVersion } = await import("@tauri-apps/api/app")
    const currentVersion = await getVersion()

    console.log(`[UPDATER] Current: ${currentVersion}, Latest: ${latestVersion}`)
    if (!isNewer(latestVersion, currentVersion)) return

    // 3. Хэрэглэгчээс асуух
    const store = useAlertStore.getState()
    const confirmed = await store.confirm(
      "Шинэчлэлт байна",
      `Шинэ хувилбар v${latestVersion} бэлэн байна. (Одоогийн: v${currentVersion})\n\nШинэчлэх үү?`
    )
    if (!confirmed) return

    // 4. Windows installer (.exe) файл олох
    const exeAsset = release.assets?.find((a: any) =>
      a.name.endsWith("_x64-setup.exe") && !a.name.endsWith(".sig")
    )
    if (!exeAsset) {
      store.alertError("Installer файл олдсонгүй")
      return
    }

    // 5. Temp folder-д татах
    store.showLoading(`v${latestVersion} татаж байна...`)

    const { tempDir } = await import("@tauri-apps/api/path")
    const temp = await tempDir()
    const destPath = `${temp}${exeAsset.name}`

    await invoke("download_file", {
      url: exeAsset.url,
      authToken: GH_TOKEN,
      destPath,
    })

    store.hideLoading()

    // 6. Installer ажиллуулах
    const confirmInstall = await store.confirm(
      "Татаж дууслаа",
      "Installer ажиллуулж шинэчлэх үү? Апп хаагдана."
    )
    if (!confirmInstall) return

    await invoke("run_installer", { path: destPath })

    const { exit } = await import("@tauri-apps/plugin-process")
    await exit(0)
  } catch (err) {
    console.error("[UPDATER] Error:", err)
    useAlertStore.getState().hideLoading()
  }
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number)
  const c = current.split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true
    if ((l[i] || 0) < (c[i] || 0)) return false
  }
  return false
}
