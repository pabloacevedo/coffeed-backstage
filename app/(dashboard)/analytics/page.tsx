import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Search,
  Smartphone,
  Clock,
  TrendingUp,
  Activity,
  UserPlus,
  BarChart3,
  Eye,
  Star,
  AlertCircle,
  Share2,
} from "lucide-react"

async function getAnalytics() {
  const supabase = await createServerSupabaseClient()

  // Usuarios activos hoy
  const today = new Date().toISOString().split("T")[0]
  const { data: activeUsersToday } = await supabase
    .from("user_activity_logs")
    .select("user_id")
    .eq("event_type", "app_open")
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`)

  const uniqueActiveUsersToday = new Set(
    activeUsersToday?.map((log) => log.user_id).filter(Boolean)
  ).size

  // Total de búsquedas
  const { count: totalSearches } = await supabase
    .from("user_activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "search")

  // Búsquedas sin resultados
  const { count: searchesWithoutResults } = await supabase
    .from("user_activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "search")
    .filter("metadata->>has_results", "eq", "false")

  // Búsquedas más comunes
  const { data: allSearches } = await supabase
    .from("user_activity_logs")
    .select("metadata")
    .eq("event_type", "search")
    .limit(1000)

  const searchCounts: Record<string, { count: number; totalResults: number }> = {}
  allSearches?.forEach((log: any) => {
    const metadata = log.metadata as any
    const query = metadata?.search_query
    if (query) {
      if (!searchCounts[query]) {
        searchCounts[query] = { count: 0, totalResults: 0 }
      }
      searchCounts[query].count++
      searchCounts[query].totalResults += metadata?.results_count || 0
    }
  })

  const topSearches = Object.entries(searchCounts)
    .map(([query, data]) => ({
      query,
      search_count: data.count,
      avg_results: (data.totalResults / data.count).toFixed(1),
    }))
    .sort((a, b) => b.search_count - a.search_count)
    .slice(0, 5)

  // Estadísticas de dispositivos
  const { data: allDevices } = await supabase
    .from("user_activity_logs")
    .select("device_info")
    .limit(1000)

  const deviceCounts: Record<string, number> = {}
  allDevices?.forEach((log: any) => {
    const deviceInfo = log.device_info as any
    const os = deviceInfo?.osName || "Desconocido"
    const brand = deviceInfo?.brand || "Desconocido"
    const key = `${os} - ${brand}`
    deviceCounts[key] = (deviceCounts[key] || 0) + 1
  })

  const deviceStats = Object.entries(deviceCounts)
    .map(([key, count]) => {
      const [os, brand] = key.split(" - ")
      return { os, brand, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Usuarios nuevos últimos 7 días
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: newUsersWeek } = await supabase
    .from("user_activity_logs")
    .select("user_id, created_at")
    .eq("event_type", "app_open")
    .filter("metadata->>first_time_user", "eq", "true")
    .gte("created_at", sevenDaysAgo.toISOString())

  // Duración promedio de sesiones (últimos 30 días)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: sessionData } = await supabase
    .from("user_activity_logs")
    .select("metadata")
    .eq("event_type", "app_background")
    .not("metadata->>session_duration_seconds", "is", null)
    .gte("created_at", thirtyDaysAgo.toISOString())

  const avgSessionDuration =
    sessionData && sessionData.length > 0
      ? Math.round(
        sessionData.reduce(
          (acc, log) => acc + Number((log.metadata as any)?.session_duration_seconds || 0),
          0
        ) / sessionData.length
      )
      : 0

  // Actividad de usuarios últimos 7 días
  const { data: last7Days } = await supabase
    .from("user_activity_logs")
    .select("user_id, created_at")
    .eq("event_type", "app_open")
    .gte("created_at", sevenDaysAgo.toISOString())

  const activityByDay: Record<string, { users: Set<string>; opens: number }> = {}
  last7Days?.forEach((log) => {
    const date = new Date(log.created_at).toISOString().split("T")[0]
    if (!activityByDay[date]) {
      activityByDay[date] = { users: new Set(), opens: 0 }
    }
    if (log.user_id) activityByDay[date].users.add(log.user_id)
    activityByDay[date].opens++
  })

  const dailyActivity = Object.entries(activityByDay)
    .map(([date, data]) => ({
      date,
      unique_users: data.users.size,
      total_opens: data.opens,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Get top rated coffee shops (mantenemos lo anterior)
  const { data: topRated } = await supabase
    .from("coffee_shops")
    .select(`id, name, image, reviews(rating)`)
    .eq("deleted", false)
    .eq("active", true)

  const shopsWithRatings = (topRated as any[])
    ?.map((shop) => {
      const ratings = shop.reviews?.map((r: any) => r.rating) || []
      const avgRating = ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0
      return {
        ...shop,
        avgRating: Number(avgRating.toFixed(2)),
        reviewCount: ratings.length,
      }
    })
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 10) || []

  // Get most viewed coffee shops (mantenemos lo anterior)
  const { data: viewsData } = await supabase
    .from("views")
    .select(`coffee_shop_id, coffee_shops(name, image)`)

  const viewsByShop = (viewsData as any[])?.reduce((acc: any, view: any) => {
    const shopId = view.coffee_shop_id
    if (!acc[shopId]) {
      acc[shopId] = {
        id: shopId,
        name: view.coffee_shops?.name || "Desconocida",
        image: view.coffee_shops?.image,
        views: 0,
      }
    }
    acc[shopId].views++
    return acc
  }, {})

  const mostViewed = Object.values(viewsByShop || {})
    .sort((a: any, b: any) => b.views - a.views)
    .slice(0, 10)

  // Get most shared coffee shops
  const { data: sharesData } = await supabase
    .from("user_activity_logs")
    .select("*")
    .eq("event_type", "share_shop")

  // Group by shop_id and count shares
  const sharesByShopId: Record<string, number> = {}
  sharesData?.forEach((log) => {
    const metadata = log.metadata as any
    const shopId = metadata?.shop_id
    if (shopId) {
      sharesByShopId[shopId] = (sharesByShopId[shopId] || 0) + 1
    }
  })

  // Get top 10 shop IDs
  const topShopIds = Object.entries(sharesByShopId)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id)

  // Fetch coffee shop details for top 10 (only if there are shares)
  let mostShared: Array<{ id: string; name: string; image: string | null; shares: number }> = []
  if (topShopIds.length > 0) {
    const { data: shopsData } = await supabase
      .from("coffee_shops")
      .select("id, name, image")
      .in("id", topShopIds)
      .eq("deleted", false)

    // Combine data
    mostShared = shopsData?.map(shop => ({
      id: shop.id,
      name: shop.name,
      image: shop.image,
      shares: sharesByShopId[shop.id]
    })).sort((a, b) => b.shares - a.shares) || []
  }

  return {
    uniqueActiveUsersToday: uniqueActiveUsersToday || 0,
    totalSearches: totalSearches || 0,
    topSearches,
    searchesWithoutResults: searchesWithoutResults || 0,
    deviceStats,
    newUsersWeek: newUsersWeek?.length || 0,
    avgSessionDuration,
    dailyActivity,
    topRated: shopsWithRatings,
    mostViewed,
    mostShared,
  }
}

async function AnalyticsContent() {
  const stats = await getAnalytics()

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const statCards = [
    {
      title: "Usuarios Activos Hoy",
      value: stats.uniqueActiveUsersToday,
      description: "Usuarios únicos que abrieron la app hoy",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Búsquedas Totales",
      value: stats.totalSearches,
      description: "Total de búsquedas realizadas",
      icon: Search,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Búsquedas Sin Resultados",
      value: stats.searchesWithoutResults,
      description: "Búsquedas que no encontraron cafeterías",
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-950",
    },
    {
      title: "Usuarios Nuevos (7d)",
      value: stats.newUsersWeek,
      description: "Nuevos usuarios esta semana",
      icon: UserPlus,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Duración Promedio",
      value: formatDuration(stats.avgSessionDuration),
      description: "Tiempo promedio por sesión (30d)",
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
  ]

  return (
    <>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Búsquedas Más Comunes
            </CardTitle>
            <CardDescription>Términos más buscados por los usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topSearches.length > 0 ? (
                stats.topSearches.map((search: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{search.query || "Sin texto"}</p>
                        <p className="text-xs text-muted-foreground">
                          Promedio: {search.avg_results} resultados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{search.search_count}</p>
                      <p className="text-xs text-muted-foreground">búsquedas</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay datos de búsquedas aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Estadísticas de Dispositivos
            </CardTitle>
            <CardDescription>Distribución por sistema operativo y marca</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.deviceStats.length > 0 ? (
                stats.deviceStats.map((device: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                        <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {device.os || "Desconocido"} - {device.brand || "Desconocido"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{device.count}</p>
                      <p className="text-xs text-muted-foreground">eventos</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay datos de dispositivos aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
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
              {stats.dailyActivity.length > 0 ? (
                stats.dailyActivity.map((day: any, index: number) => (
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
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay datos de actividad aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Rated Coffee Shops */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Cafeterías mejor calificadas
            </CardTitle>
            <CardDescription>Top 10 cafeterías con mejor calificación promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topRated.length > 0 ? (
                stats.topRated.map((shop, index) => (
                  <div key={shop.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    {shop.image ? (
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shop.reviewCount} reseñas
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{shop.avgRating}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay datos disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Viewed Coffee Shops */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Cafeterías más vistas
            </CardTitle>
            <CardDescription>Top 10 cafeterías con más visualizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.mostViewed.length > 0 ? (
                stats.mostViewed.map((shop: any, index) => (
                  <div key={shop.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 font-bold text-purple-600 dark:text-purple-400">
                      {index + 1}
                    </div>
                    {shop.image ? (
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{shop.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-bold">{shop.views}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay datos disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Shared Coffee Shops */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Cafeterías más compartidas
            </CardTitle>
            <CardDescription>Top 10 cafeterías más compartidas por los usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.mostShared.length > 0 ? (
                stats.mostShared.map((shop: any, index) => (
                  <div key={shop.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 font-bold text-green-600 dark:text-green-400">
                      {index + 1}
                    </div>
                    {shop.image ? (
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{shop.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-bold">{shop.shares}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay datos disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 shadow-lg">
          <BarChart3 className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Estadísticas de actividad y comportamiento de usuarios
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}
