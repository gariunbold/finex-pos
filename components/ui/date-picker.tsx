"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dateToStr, strToDate } from "@/lib/format"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string | null // yyyy.MM.dd
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "yyyy.MM.dd",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? strToDate(value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <button
            type="button"
            disabled={disabled}
            {...props}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground hover:bg-muted/50 transition-colors tabular disabled:opacity-50 disabled:pointer-events-none",
              className
            )}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className={cn(!value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </button>
        )}
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(d) => {
            if (d) {
              onChange?.(dateToStr(d))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
