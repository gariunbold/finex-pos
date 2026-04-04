"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">Хуудас олдсонгүй</p>
      </div>
      <Button onClick={() => router.push("/")} variant="default">
        Нүүр хуудас руу буцах
      </Button>
    </div>
  )
}
