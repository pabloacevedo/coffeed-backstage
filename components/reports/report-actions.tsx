"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, X } from "lucide-react"
import { resolveReport, dismissReport } from "@/app/(dashboard)/reports/actions"

export function ReportActions({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false)

  const handleResolve = async () => {
    setLoading(true)
    try {
      await resolveReport(reportId)
      toast.success("Reporte marcado como resuelto")
    } catch (error: any) {
      toast.error(error.message || "Error al resolver reporte")
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    setLoading(true)
    try {
      await dismissReport(reportId)
      toast.success("Reporte descartado")
    } catch (error: any) {
      toast.error(error.message || "Error al descartar reporte")
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleResolve} disabled={loading}>
        <Check className="mr-2 h-4 w-4" />
        {loading ? "Resolviendo..." : "Resolver"}
      </Button>
      <Button size="sm" variant="outline" onClick={handleDismiss} disabled={loading}>
        <X className="mr-2 h-4 w-4" />
        {loading ? "Descartando..." : "Descartar"}
      </Button>
    </div>
  )
}
