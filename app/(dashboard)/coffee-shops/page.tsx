import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CoffeeShopsTable } from "@/components/coffee-shops/coffee-shops-table"
import { Skeleton } from "@/components/ui/skeleton"

async function getCoffeeShops() {
  const supabase = await createServerSupabaseClient()

  // Supabase tiene un límite de 1000 registros por consulta
  // Para obtener más, necesitamos hacer múltiples consultas usando paginación
  let allShops: any[] = []
  let hasMore = true
  let offset = 0
  const pageSize = 1000

  while (hasMore) {
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
      .order("name", { ascending: true }) // Ordenar alfabéticamente para mejor experiencia
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching coffee shops:', error)
      break
    }

    if (coffeeShops && coffeeShops.length > 0) {
      allShops = [...allShops, ...coffeeShops]
      offset += pageSize

      // Si recibimos menos registros que el tamaño de página, no hay más
      if (coffeeShops.length < pageSize) {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }

  // Calculate average rating for each shop
  return allShops.map((shop) => {
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
