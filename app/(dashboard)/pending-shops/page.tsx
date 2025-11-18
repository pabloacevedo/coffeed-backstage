import { Suspense } from "react"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { Skeleton } from "@/components/ui/skeleton"
import { PendingShopsTable } from "@/components/pending-shops/pending-shops-table"

async function getPendingShops() {
  // ✅ Usar cliente admin para bypasear RLS y ver TODAS las cafeterías pendientes
  const supabase = createAdminSupabaseClient()

  const { data: pendingShops, error } = await supabase
    .from("coffee_shops")
    .select(`
      *,
      addresses(*),
      schedules(*),
      contacts(*),
      reviews(rating)
    `)
    .eq("deleted", false)
    .eq("active", false)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })

  if (error) {
    console.error('Error fetching pending coffee shops:', error)
    return []
  }

  // Calculate average rating for each shop
  return (pendingShops as any[]).map((shop) => {
    const ratings = shop.reviews?.map((r: any) => r.rating) || []
    const avgRating = ratings.length > 0
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : 0

    return {
      ...shop,
      avgRating: Number(avgRating.toFixed(1)),
      reviewCount: ratings.length,
    }
  })
}

async function PendingShopsContent() {
  const pendingShops = await getPendingShops()

  return <PendingShopsTable data={pendingShops} />
}

export default function PendingShopsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cafeterías Pendientes</h1>
          <p className="text-muted-foreground">
            Revisa y aprueba las cafeterías enviadas por los usuarios
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <PendingShopsContent />
      </Suspense>
    </div>
  )
}
