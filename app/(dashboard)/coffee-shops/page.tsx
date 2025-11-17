import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CoffeeShopsTable } from "@/components/coffee-shops/coffee-shops-table"
import { Skeleton } from "@/components/ui/skeleton"

async function getCoffeeShops() {
  const supabase = await createServerSupabaseClient()

  const { data: coffeeShops, error } = await supabase
    .from("coffee_shops")
    .select(`
      *,
      addresses(*),
      schedules(*),
      contacts(*),
      reviews(rating)
    `)
    .eq("deleted", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching coffee shops:", error)
    return []
  }

  // Calculate average rating for each shop
  return (coffeeShops as any[]).map((shop) => {
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

async function CoffeeShopsContent() {
  const coffeeShops = await getCoffeeShops()

  return <CoffeeShopsTable data={coffeeShops} />
}

export default function CoffeeShopsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cafeterías</h1>
          <p className="text-muted-foreground">
            Gestiona todas las cafeterías de la plataforma
          </p>
        </div>
        <Button asChild>
          <Link href="/coffee-shops/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cafetería
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CoffeeShopsContent />
      </Suspense>
    </div>
  )
}
