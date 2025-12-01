"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DeviceStat {
  model: string
  count: number
  lastActivity: string
}

interface DeviceStatsCardProps {
  deviceStats: DeviceStat[]
}

export function DeviceStatsCard({ deviceStats }: DeviceStatsCardProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [allDevices, setAllDevices] = useState<DeviceStat[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 50

  const loadAllDevices = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/devices?page=${page}&pageSize=${pageSize}`)
      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setAllDevices(result.data)
      setTotalPages(result.pagination.totalPages)
      setCurrentPage(result.pagination.page)
    } catch (error) {
      console.error("Error loading devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowMore = async () => {
    await loadAllDevices(1)
    setShowAllModal(true)
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      await loadAllDevices(newPage)
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Hace un momento"
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays === 1) return "Ayer"
    if (diffDays < 7) return `Hace ${diffDays} días`

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Estadísticas de Dispositivos
          </CardTitle>
          <CardDescription>Distribución por modelo de dispositivo, ordenado por última actividad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deviceStats.length > 0 ? (
              <>
                {deviceStats.map((device, index: number) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{device.model}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(device.lastActivity)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{device.count}</p>
                      <p className="text-xs text-muted-foreground">eventos</p>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Ver todos los dispositivos
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay datos de dispositivos aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Todos los Dispositivos
            </DialogTitle>
            <DialogDescription>
              Historial completo de dispositivos ordenado por última actividad
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando dispositivos...
            </div>
          ) : (
            <>
              <div className="space-y-3 mt-4">
                {allDevices.map((device, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1
                  return (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {globalIndex}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{device.model}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(device.lastActivity)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{device.count}</p>
                        <p className="text-xs text-muted-foreground">eventos</p>
                      </div>
                    </div>
                  )
                })}
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
