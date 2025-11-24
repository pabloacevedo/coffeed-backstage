import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Star,
  Eye,
  Flag,
  Bookmark,
  Coffee,
  Shield
} from "lucide-react"
import Link from "next/link"

async function getUserDetails(id: string) {
  const supabase = createAdminSupabaseClient()

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (profileError || !profile) {
    return null
  }

  // Get auth user data
  const { data: authUser } = await supabase.auth.admin.getUserById(id)

  // Get last 10 views with coffee shop info
  const { data: views } = await supabase
    .from("views")
    .select(`
      id,
      created_at,
      coffee_shops(id, name, image)
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get reviews with coffee shop info
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      coffee_shops(id, name)
    `)
    .eq("user_id", id)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get reports with coffee shop info
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      id,
      report_type,
      description,
      status,
      created_at,
      coffee_shops(id, name)
    `)
    .eq("user_id", id)
    .eq("deleted", false)
    .order("created_at", { ascending: false })

  // Get counts
  const [
    { count: totalReviews },
    { count: totalBookmarks },
    { count: totalViews },
    { count: totalReports }
  ] = await Promise.all([
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("deleted", false),
    supabase
      .from("bookmark_lists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("deleted", false),
    supabase
      .from("views")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("deleted", false)
  ])

  return {
    ...profile,
    email: authUser?.user?.email || "",
    isAdmin: authUser?.user?.user_metadata?.is_admin || false,
    lastSignIn: authUser?.user?.last_sign_in_at,
    views: views || [],
    reviews: reviews || [],
    reports: reports || [],
    totalReviews: totalReviews || 0,
    totalBookmarks: totalBookmarks || 0,
    totalViews: totalViews || 0,
    totalReports: totalReports || 0
  }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUserDetails(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {user.full_name || "Usuario sin nombre"}
                </h1>
                {user.isAdmin && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vistas</p>
                <p className="font-bold text-lg">{user.totalViews}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reseñas</p>
                <p className="font-bold text-lg">{user.totalReviews}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Favoritos</p>
                <p className="font-bold text-lg">{user.totalBookmarks}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Flag className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reportes</p>
                <p className="font-bold text-lg">{user.totalReports}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Registrado:</span>
            <span>
              {new Date(user.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </span>
          </div>
          {user.lastSignIn && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Último acceso:</span>
              <span>
                {new Date(user.lastSignIn).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last 10 Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Últimas Cafeterías Vistas
          </CardTitle>
          <CardDescription>Las últimas 10 cafeterías que el usuario visitó</CardDescription>
        </CardHeader>
        <CardContent>
          {user.views.length > 0 ? (
            <div className="space-y-3">
              {user.views.map((view: any) => (
                <div key={view.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {view.coffee_shops?.image ? (
                      <img
                        src={view.coffee_shops.image}
                        alt={view.coffee_shops.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Coffee className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <Link
                      href={`/coffee-shops/${view.coffee_shops?.id}`}
                      className="font-medium hover:underline"
                    >
                      {view.coffee_shops?.name || "Cafetería eliminada"}
                    </Link>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(view.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Este usuario no ha visitado ninguna cafetería
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5" />
            Reseñas
          </CardTitle>
          <CardDescription>Reseñas escritas por el usuario</CardDescription>
        </CardHeader>
        <CardContent>
          {user.reviews.length > 0 ? (
            <div className="space-y-4">
              {user.reviews.map((review: any) => (
                <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/coffee-shops/${review.coffee_shops?.id}`}
                      className="font-medium hover:underline"
                    >
                      {review.coffee_shops?.name || "Cafetería eliminada"}
                    </Link>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Este usuario no ha escrito ninguna reseña
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flag className="h-5 w-5" />
            Reportes Enviados
          </CardTitle>
          <CardDescription>Reportes que el usuario ha enviado sobre cafeterías</CardDescription>
        </CardHeader>
        <CardContent>
          {user.reports.length > 0 ? (
            <div className="space-y-4">
              {user.reports.map((report: any) => (
                <div key={report.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/coffee-shops/${report.coffee_shops?.id}`}
                      className="font-medium hover:underline"
                    >
                      {report.coffee_shops?.name || "Cafetería eliminada"}
                    </Link>
                    <Badge
                      variant={
                        report.status === "pending" ? "destructive" :
                        report.status === "resolved" ? "default" :
                        "secondary"
                      }
                    >
                      {report.status === "pending" ? "Pendiente" :
                       report.status === "resolved" ? "Resuelto" :
                       report.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {report.report_type === "closed" ? "Cerrado permanentemente" :
                       report.report_type === "wrong_info" ? "Información incorrecta" :
                       report.report_type === "duplicate" ? "Duplicado" :
                       report.report_type === "not_coffee_shop" ? "No es cafetería" :
                       report.report_type}
                    </Badge>
                  </div>
                  {report.description && (
                    <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Este usuario no ha enviado ningún reporte
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
