import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Coffee, Users, Star, Flag, TrendingUp, Eye, ArrowRight, ExternalLink, Sparkles } from "lucide-react"
import Link from "next/link"
import { CoffeedLogo } from "@/components/coffeed-logo"

async function getStats() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: coffeeShopsCount },
    { count: usersCount },
    { count: reviewsCount },
    { count: reportsCount },
    { count: viewsCount },
  ] = await Promise.all([
    supabase.from("coffee_shops").select("*", { count: "exact", head: true }).eq("deleted", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("deleted", false),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("deleted", false).eq("status", "pending"),
    supabase.from("views").select("*", { count: "exact", head: true }),
  ])

  // Get average rating
  const { data: avgRating } = await supabase
    .from("reviews")
    .select("rating")
    .eq("deleted", false)

  const averageRating = avgRating && avgRating.length > 0
    ? (avgRating.reduce((acc, r) => acc + r.rating, 0) / avgRating.length).toFixed(1)
    : "0.0"

  // Get recent coffee shops
  const { data: recentShops } = await supabase
    .from("coffee_shops")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get pending reports
  const { data: pendingReports } = await supabase
    .from("reports")
    .select(`
      *,
      coffee_shops(name)
    `)
    .eq("deleted", false)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  return {
    coffeeShopsCount: coffeeShopsCount || 0,
    usersCount: usersCount || 0,
    reviewsCount: reviewsCount || 0,
    reportsCount: reportsCount || 0,
    viewsCount: viewsCount || 0,
    averageRating,
    recentShops: recentShops || [],
    pendingReports: pendingReports || [],
  }
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  )
}

async function DashboardContent() {
  const stats = await getStats()

  const statCards = [
    {
      title: "Cafeterías",
      value: stats.coffeeShopsCount,
      description: "Total de cafeterías activas",
      icon: Coffee,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/coffee-shops",
    },
    {
      title: "Usuarios",
      value: stats.usersCount,
      description: "Usuarios registrados",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/users",
    },
    {
      title: "Reseñas",
      value: stats.reviewsCount,
      description: `Promedio: ${stats.averageRating}★`,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      href: "/reviews",
    },
    {
      title: "Reportes Pendientes",
      value: stats.reportsCount,
      description: "Requieren atención",
      icon: Flag,
      color: "text-red-600",
      bgColor: "bg-red-100",
      href: "/reports",
    },
    {
      title: "Vistas Totales",
      value: stats.viewsCount,
      description: "Analytics de visualizaciones",
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/analytics",
    },
  ]

  return (
    <>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-all hover:shadow-md cursor-pointer hover:border-primary/50">
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
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Coffee Shops */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Cafeterías Recientes</CardTitle>
              <CardDescription>Últimas cafeterías agregadas al sistema</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/coffee-shops">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentShops.length > 0 ? (
                stats.recentShops.map((shop: any) => (
                  <Link
                    key={shop.id}
                    href={`/coffee-shops/${shop.id}`}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-colors hover:bg-muted/50 rounded-lg p-2 -mx-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <Coffee className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{shop.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(shop.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={shop.active ? "default" : "secondary"}>
                        {shop.active ? "Activa" : "Inactiva"}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay cafeterías recientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Reportes Pendientes</CardTitle>
              <CardDescription>Reportes que requieren revisión</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.pendingReports.length > 0 ? (
                stats.pendingReports.map((report: any) => (
                  <Link
                    key={report.id}
                    href="/reports"
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-colors hover:bg-muted/50 rounded-lg p-2 -mx-2"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 flex-shrink-0">
                        <Flag className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{report.coffee_shops?.name || "Cafetería"}</p>
                        <p className="text-xs text-muted-foreground truncate">{report.report_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="destructive">Pendiente</Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay reportes pendientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Bienvenido a Coffeed Backstage
          </CardTitle>
          <CardDescription>
            Panel de administración para gestionar tu plataforma de cafeterías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Desde aquí puedes administrar cafeterías, usuarios, moderar reseñas y reportes,
            además de visualizar analíticas detalladas del rendimiento de la plataforma.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 p-2.5 shadow-lg">
          <CoffeedLogo size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Dashboard
            <Sparkles className="h-6 w-6 text-purple-500" />
          </h1>
          <p className="text-muted-foreground">
            Resumen general de la plataforma Coffeed
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  )
}
