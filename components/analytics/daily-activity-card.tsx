"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, BarChart3, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DailyActivity {
  date: string
  unique_users: number
  total_opens: number
}

interface DailyActivityCardProps {
  activities: DailyActivity[]
}

export function DailyActivityCard({ activities }: DailyActivityCardProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [allActivities, setAllActivities] = useState<DailyActivity[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 30

  const loadAllActivities = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/daily-activity?page=${page}&pageSize=${pageSize}`)
      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setAllActivities(result.data)
      setTotalPages(result.pagination.totalPages)
      setCurrentPage(result.pagination.page)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowMore = async () => {
    await loadAllActivities(1)
    setShowAllModal(true)
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      await loadAllActivities(newPage)
    }
  }

  return (
    <>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            Usuarios Activos - Últimos 7 Días
          </CardTitle>
          <CardDescription>Usuarios únicos que abrieron la app cada día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.length > 0 ? (
              <>
                {activities.map((day: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                        <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(day.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.total_opens} aperturas totales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {day.unique_users}
                      </p>
                      <p className="text-xs text-muted-foreground">usuarios únicos</p>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Ver historial completo (90 días)
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay datos de actividad aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              Historial de Actividad Diaria
            </DialogTitle>
            <DialogDescription>
              Usuarios activos por día - Últimos 90 días
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando actividades...
            </div>
          ) : (
            <>
              <div className="space-y-3 mt-4">
                {allActivities.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                        <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(day.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.total_opens} aperturas totales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {day.unique_users}
                      </p>
                      <p className="text-xs text-muted-foreground">usuarios únicos</p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
