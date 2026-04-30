"use client"

import { useAlertStore } from "@/lib/store"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react"

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

const iconColors = {
  error: "text-red-500",
  warning: "text-yellow-500",
  success: "text-emerald-500",
  info: "text-blue-500",
}

export function AppAlert() {
  const {
    alertOpen, alertType, alertTitle, alertMessage, alertMode,
    promptValue, closeAlert, setPromptValue,
    loadingOpen, loadingMessage,
  } = useAlertStore()

  const Icon = icons[alertType]

  return (
    <>
      {/* Alert / Confirm / Prompt Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={(open) => { if (!open) closeAlert(false) }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className={iconColors[alertType]}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <AlertDialogTitle className="text-sm font-semibold">
                  {alertTitle}
                </AlertDialogTitle>
                {alertMessage && (
                  <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                    {alertMessage}
                  </AlertDialogDescription>
                )}
              </div>
            </div>
          </AlertDialogHeader>

          {/* Prompt input */}
          {alertMode === "prompt" && (
            <div className="px-1 py-2">
              <Input
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") closeAlert(true) }}
                autoFocus
              />
            </div>
          )}

          <AlertDialogFooter>
            {alertMode === "alert" && (
              <Button onClick={() => closeAlert()}>
                Ойлголоо
              </Button>
            )}
            {alertMode === "confirm" && (
              <>
                <Button onClick={() => closeAlert(true)}>
                  Тийм
                </Button>
                <Button variant="outline" onClick={() => closeAlert(false)}>
                  Үгүй
                </Button>
              </>
            )}
            {alertMode === "prompt" && (
              <>
                <Button variant="outline" onClick={() => closeAlert(false)}>
                  Цуцлах
                </Button>
                <Button onClick={() => closeAlert(true)}>
                  Баталах
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading overlay */}
      {loadingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl bg-card px-6 py-4 border border-border">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm text-foreground">
              {loadingMessage || "Уншиж байна..."}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
