"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Clock, Plus, Save } from "lucide-react"

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

interface Schedule {
  id?: string
  day_of_week: number
  open_time: string
  close_time: string
  closed: boolean
}

interface ScheduleManagerProps {
  coffeeShopId: string
  existingSchedules: any[]
}

export function ScheduleManager({ coffeeShopId, existingSchedules }: ScheduleManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Initialize schedules for all 7 days
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const scheduleMap = new Map(
      existingSchedules.map((s) => [s.day_of_week, s])
    )

    return Array.from({ length: 7 }, (_, dayIndex) => {
      const existing = scheduleMap.get(dayIndex)
      return {
        id: existing?.id,
        day_of_week: dayIndex,
        open_time: existing?.open_time || "09:00",
        close_time: existing?.close_time || "18:00",
        closed: existing?.closed ?? false,
      }
    })
  })

  const handleToggleClosed = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.day_of_week === dayIndex
          ? { ...schedule, closed: !schedule.closed }
          : schedule
      )
    )
  }

  const handleTimeChange = (dayIndex: number, field: "open_time" | "close_time", value: string) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.day_of_week === dayIndex
          ? { ...schedule, [field]: value }
          : schedule
      )
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Delete all existing schedules first
      if (existingSchedules.length > 0) {
        const { error: deleteError } = await supabase
          .from("schedules")
          .delete()
          .eq("coffee_shop_id", coffeeShopId)

        if (deleteError) throw deleteError
      }

      // Insert all schedules
      const schedulesToInsert = schedules.map((schedule) => ({
        coffee_shop_id: coffeeShopId,
        day_of_week: schedule.day_of_week,
        open_time: schedule.closed ? null : schedule.open_time,
        close_time: schedule.closed ? null : schedule.close_time,
        closed: schedule.closed,
        deleted: false,
      }))

      const { error: insertError } = await supabase
        .from("schedules")
        .insert(schedulesToInsert)

      if (insertError) throw insertError

      toast.success("Horarios actualizados correctamente")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar horarios")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="mr-2 h-4 w-4" />
          Gestionar Horarios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Horarios</DialogTitle>
          <DialogDescription>
            Configura los horarios de atención para cada día de la semana
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.day_of_week}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4"
            >
              <div className="w-full sm:w-28 flex-shrink-0">
                <p className="font-medium">{daysOfWeek[schedule.day_of_week]}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={!schedule.closed}
                  onCheckedChange={() => handleToggleClosed(schedule.day_of_week)}
                  id={`closed-${schedule.day_of_week}`}
                />
                <Label
                  htmlFor={`closed-${schedule.day_of_week}`}
                  className="text-sm cursor-pointer whitespace-nowrap"
                >
                  {schedule.closed ? "Cerrado" : "Abierto"}
                </Label>
              </div>

              {!schedule.closed && (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1 flex-shrink-0">
                    <Label htmlFor={`open-${schedule.day_of_week}`} className="text-xs whitespace-nowrap">
                      Apertura
                    </Label>
                    <Input
                      id={`open-${schedule.day_of_week}`}
                      type="time"
                      value={schedule.open_time}
                      onChange={(e) =>
                        handleTimeChange(schedule.day_of_week, "open_time", e.target.value)
                      }
                      className="w-[140px]"
                    />
                  </div>
                  <span className="mt-5 flex-shrink-0">-</span>
                  <div className="space-y-1 flex-shrink-0">
                    <Label htmlFor={`close-${schedule.day_of_week}`} className="text-xs whitespace-nowrap">
                      Cierre
                    </Label>
                    <Input
                      id={`close-${schedule.day_of_week}`}
                      type="time"
                      value={schedule.close_time}
                      onChange={(e) =>
                        handleTimeChange(schedule.day_of_week, "close_time", e.target.value)
                      }
                      className="w-[140px]"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Guardando..." : "Guardar Horarios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
