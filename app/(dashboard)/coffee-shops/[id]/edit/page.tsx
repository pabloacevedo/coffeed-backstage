import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CoffeeShopForm } from "@/components/coffee-shops/coffee-shop-form"
import { Eye } from "lucide-react"
import Link from "next/link"

async function getCoffeeShop(id: string) {
  // ✅ Usar cliente admin para poder editar todas las cafeterías, incluyendo las inactivas
  const supabase = createAdminSupabaseClient()

  const { data: shop, error } = await supabase
    .from("coffee_shops")
    .select(`
      *,
      addresses(*),
      schedules(*),
      contacts(*)
    `)
    .eq("id", id)
    .single()

  if (error || !shop) {
    return null
  }

  return shop as any
}

export default async function EditCoffeeShopPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const shop = await getCoffeeShop(id)

  if (!shop) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Cafetería</h1>
          <p className="text-muted-foreground">
            Actualiza la información de {shop.name}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/coffee-shops/${shop.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Cafetería</CardTitle>
          <CardDescription>
            Modifica los datos y presiona guardar para actualizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoffeeShopForm shop={shop} />
        </CardContent>
      </Card>
    </div>
  )
}
