"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Search, Eye, Share2, UserPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ActivityLog {
  id: string
  event_type: string
  created_at: string
  metadata: any
  device_info: any
  user_id: string
}

interface RecentActivitiesCardProps {
  activities: ActivityLog[]
}

const eventTypeIcons: Record<string, any> = {
  search: Search,
  view_shop: Eye,
  share_shop: Share2,
  app_open: UserPlus,
}

const eventTypeLabels: Record<string, string> = {
  search: "Búsqueda",
  view_shop: "Vista de cafetería",
  share_shop: "Compartió cafetería",
  app_open: "Abrió app",
  app_background: "App en segundo plano",
}

export function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [allActivities, setAllActivities] = useState<ActivityLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 50

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
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getActivityDescription = (activity: ActivityLog) => {
    const metadata = activity.metadata || {}

    switch (activity.event_type) {
      case "search":
        return `"${metadata.search_query || "Sin texto"}" - ${metadata.results_count || 0} resultados`
      case "view_shop":
        return metadata.shop_name || "Cafetería"
      case "share_shop":
        return metadata.shop_name || "Cafetería"
      case "app_open":
        return metadata.first_time_user ? "Nuevo usuario" : "Usuario recurrente"
      case "app_background":
        return metadata.session_duration_seconds
          ? `Sesión de ${Math.floor(metadata.session_duration_seconds / 60)} min`
          : "Sesión finalizada"
      default:
        return activity.event_type
    }
  }

  const loadAllActivities = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/activities?page=${page}&pageSize=${pageSize}`)
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

  const renderActivity = (activity: ActivityLog, index: number) => {
    const Icon = eventTypeIcons[activity.event_type] || Activity
    const label = eventTypeLabels[activity.event_type] || activity.event_type

    return (
      <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
          <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground truncate">
                {getActivityDescription(activity)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(activity.created_at)}
            </p>
          </div>
          {activity.device_info && (
            <p className="text-xs text-muted-foreground mt-1">
              {activity.device_info.modelName || activity.device_info.modelId || "Dispositivo desconocido"}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Actividades Recientes
          </CardTitle>
          <CardDescription>Últimas 10 actividades registradas en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.length > 0 ? (
              <>
                {activities.map((activity, index) => renderActivity(activity, index))}
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Ver todas las actividades
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay actividades registradas aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Todas las Actividades
            </DialogTitle>
            <DialogDescription>
              Historial completo de actividades registradas
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando actividades...
            </div>
          ) : (
            <>
              <div className="space-y-3 mt-4">
                {allActivities.map((activity, index) => renderActivity(activity, index))}
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
