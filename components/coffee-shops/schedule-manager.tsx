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
import { toast } from "sonner"
import { Clock, Save } from "lucide-react"
import { ScheduleEditor, type ScheduleDay } from "./schedule-editor"

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
  const [schedules, setSchedules] = useState<ScheduleDay[]>(() => {
    const scheduleMap = new Map(
      existingSchedules.map((s) => [s.day_of_week, s])
    )

    return Array.from({ length: 7 }, (_, dayIndex) => {
      const existing = scheduleMap.get(dayIndex)
      return {
        dayOfWeek: dayIndex,
        openTime: existing?.open_time || "09:00",
        closeTime: existing?.close_time || "18:00",
        isClosed: existing?.closed ?? false,
      }
    })
  })

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
        day_of_week: schedule.dayOfWeek,
        open_time: schedule.isClosed ? null : schedule.openTime,
        close_time: schedule.isClosed ? null : schedule.closeTime,
        closed: schedule.isClosed,
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

        <div className="py-4">
          <ScheduleEditor
            schedules={schedules}
            onChange={setSchedules}
            disabled={loading}
          />
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
