import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, TrendingUp, Eye, Star } from "lucide-react"

async function getAnalytics() {
  const supabase = await createServerSupabaseClient()

  // Get top rated coffee shops
  const { data: topRated } = await supabase
    .from("coffee_shops")
    .select(`
      id,
      name,
      image,
      reviews(rating)
    `)
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

  // Get most viewed coffee shops
  const { data: viewsData } = await supabase
    .from("views")
    .select(`
      coffee_shop_id,
      coffee_shops(name, image)
    `)

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

  // Get reviews over time (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("created_at, rating")
    .eq("deleted", false)
    .gte("created_at", thirtyDaysAgo.toISOString())

  const reviewsByDay = recentReviews?.reduce((acc: any, review: any) => {
    const date = new Date(review.created_at).toLocaleDateString("es-ES")
    if (!acc[date]) {
      acc[date] = { count: 0, totalRating: 0 }
    }
    acc[date].count++
    acc[date].totalRating += review.rating
    return acc
  }, {})

  return {
    topRated: shopsWithRatings,
    mostViewed,
    reviewsByDay: Object.entries(reviewsByDay || {}).map(([date, data]: [string, any]) => ({
      date,
      count: data.count,
      avgRating: (data.totalRating / data.count).toFixed(1),
    })),
  }
}

async function AnalyticsContent() {
  const analytics = await getAnalytics()

  return (
    <div className="space-y-6">
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
            {analytics.topRated.map((shop, index) => (
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Viewed Coffee Shops */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            Cafeterías más vistas
          </CardTitle>
          <CardDescription>Top 10 cafeterías con más visualizaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.mostViewed.map((shop: any, index) => (
              <div key={shop.id} className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
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
                  <Eye className="h-4 w-4 text-purple-600" />
                  <span className="font-bold">{shop.views}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Actividad de reseñas (últimos 30 días)
          </CardTitle>
          <CardDescription>Total de reseñas por día</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.reviewsByDay.length > 0 ? (
            <div className="space-y-2">
              {analytics.reviewsByDay.slice(0, 10).map((day: any) => (
                <div key={day.date} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span className="text-sm">{day.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{day.count} reseñas</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{day.avgRating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No hay datos disponibles</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Analíticas
        </h1>
        <p className="text-muted-foreground">
          Visualiza estadísticas y tendencias de la plataforma
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}
