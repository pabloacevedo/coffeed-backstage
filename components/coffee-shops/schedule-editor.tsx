"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export interface ScheduleDay {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

interface ScheduleEditorProps {
  schedules: ScheduleDay[]
  onChange: (schedules: ScheduleDay[]) => void
  disabled?: boolean
}

export function ScheduleEditor({ schedules, onChange, disabled = false }: ScheduleEditorProps) {
  const updateSchedule = (dayIndex: number, field: keyof ScheduleDay, value: any) => {
    const newSchedules = schedules.map((s, i) =>
      i === dayIndex ? { ...s, [field]: value } : s
    )
    onChange(newSchedules)
  }

  const copyFromPreviousDay = (dayIndex: number) => {
    // Para Lunes (1), copiar de Domingo (0)
    // Para otros días, copiar del día anterior
    let previousDayIndex: number

    if (dayIndex === 1) {
      // Lunes copia de Domingo
      previousDayIndex = 0
    } else if (dayIndex === 0) {
      // Domingo copia de Sábado
      previousDayIndex = 6
    } else {
      // Otros días copian del anterior
      previousDayIndex = dayIndex - 1
    }

    const previousSchedule = schedules[previousDayIndex]

    if (previousSchedule) {
      const newSchedules = schedules.map((s, i) =>
        i === dayIndex
          ? {
              ...s,
              openTime: previousSchedule.openTime,
              closeTime: previousSchedule.closeTime,
              isClosed: previousSchedule.isClosed,
            }
          : s
      )
      onChange(newSchedules)
      toast.success(`Horario copiado desde ${daysOfWeek[previousDayIndex]}`)
    }
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule, index) => (
        <div
          key={index}
          className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-4 pb-3 border-b last:border-b-0"
        >
          <div className="flex items-center gap-2 md:w-32">
            <div className="font-medium flex-1">{daysOfWeek[schedule.dayOfWeek]}</div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyFromPreviousDay(index)}
              className="h-8 w-8 p-0"
              title="Copiar horario del día anterior"
              disabled={disabled}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="time"
                value={schedule.openTime}
                onChange={(e) => updateSchedule(index, "openTime", e.target.value)}
                disabled={schedule.isClosed || disabled}
                className="flex-1 sm:w-auto"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <Input
                type="time"
                value={schedule.closeTime}
                onChange={(e) => updateSchedule(index, "closeTime", e.target.value)}
                disabled={schedule.isClosed || disabled}
                className="flex-1 sm:w-auto"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={schedule.isClosed}
                onChange={(e) => updateSchedule(index, "isClosed", e.target.checked)}
                className="rounded"
                disabled={disabled}
              />
              <span className="text-sm">Cerrado</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}
