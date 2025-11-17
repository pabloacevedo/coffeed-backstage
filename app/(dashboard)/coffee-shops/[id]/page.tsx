import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Phone, Instagram, Globe, Clock, Star, Edit, Flag } from "lucide-react"
import Link from "next/link"
import { ToggleActiveButton } from "@/components/coffee-shops/toggle-active-button"
import { ScheduleManager } from "@/components/coffee-shops/schedule-manager"
import { ContactsManager } from "@/components/coffee-shops/contacts-manager"
import { ImageViewer } from "@/components/coffee-shops/image-viewer"

async function getCoffeeShop(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: shop, error } = await supabase
    .from("coffee_shops")
    .select(`
      *,
      addresses(*),
      schedules(*),
      contacts(*),
      reviews(rating, comment, created_at, user_id),
      reports(id, status, deleted)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching coffee shop:", error)
    return null
  }

  if (!shop) {
    return null
  }

  return shop as any
}

const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default async function CoffeeShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const shop = await getCoffeeShop(id)

  if (!shop) {
    notFound()
  }

  const address = shop.addresses?.[0]
  const avgRating = shop.reviews?.length > 0
    ? shop.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / shop.reviews.length
    : 0

  // Count active reports (not deleted)
  const activeReports = shop.reports?.filter((r: any) => !r.deleted) || []
  const pendingReports = activeReports.filter((r: any) => r.status === 'pending')
  const resolvedReports = activeReports.filter((r: any) => r.status === 'resolved')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{shop.name}</h1>
          <p className="text-muted-foreground">{shop.description || "Sin descripción"}</p>
        </div>
        <div className="flex gap-2">
          <ToggleActiveButton shopId={shop.id} currentStatus={shop.active} />
          <Button asChild>
            <Link href={`/coffee-shops/${shop.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Status & Image */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Estado actual</p>
              <Badge variant={shop.active ? "default" : "secondary"} className="text-sm">
                {shop.active ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Calificación promedio</p>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({shop.reviews?.length || 0} reseñas)
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Reportes</p>
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold">{pendingReports.length}</span>
                <span className="text-sm text-muted-foreground">
                  pendientes
                </span>
              </div>
              {activeReports.length > 0 && (
                <Button variant="outline" size="sm" asChild className="mt-2 w-full">
                  <Link href={`/reports?coffee_shop=${shop.id}`}>
                    <Flag className="mr-2 h-4 w-4" />
                    Ver Reportes ({activeReports.length})
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Imagen</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageViewer image={shop.image} name={shop.name} coffeeShopId={shop.id} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="schedules">Horarios</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas ({shop.reviews?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección
              </CardTitle>
            </CardHeader>
            <CardContent>
              {address ? (
                <div className="space-y-2">
                  <p className="font-medium">{address.street}</p>
                  <p className="text-muted-foreground">
                    {address.city}, {address.country}
                  </p>
                  {shop.location_latitude && shop.location_longitude && (
                    <p className="text-sm text-muted-foreground">
                      Coordenadas: {shop.location_latitude}, {shop.location_longitude}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Sin dirección registrada</p>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Contacto</CardTitle>
              <ContactsManager
                coffeeShopId={shop.id}
                existingContacts={shop.contacts || []}
              />
            </CardHeader>
            <CardContent>
              {shop.contacts && shop.contacts.length > 0 ? (
                <div className="space-y-3">
                  {shop.contacts.map((contact: any) => (
                    <div key={contact.id} className="flex items-center gap-3">
                      {contact.type === "phone" && <Phone className="h-4 w-4 text-muted-foreground" />}
                      {contact.type === "instagram" && <Instagram className="h-4 w-4 text-muted-foreground" />}
                      {contact.type === "web" && <Globe className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">{contact.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Sin información de contacto</p>
                  <ContactsManager
                    coffeeShopId={shop.id}
                    existingContacts={[]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de atención
                </CardTitle>
              </div>
              <ScheduleManager
                coffeeShopId={shop.id}
                existingSchedules={shop.schedules || []}
              />
            </CardHeader>
            <CardContent>
              {shop.schedules && shop.schedules.length > 0 ? (
                <div className="space-y-3">
                  {shop.schedules
                    .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
                    .map((schedule: any) => (
                      <div key={schedule.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <span className="font-medium">{daysOfWeek[schedule.day_of_week]}</span>
                        {schedule.closed ? (
                          <Badge variant="secondary">Cerrado</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {schedule.open_time} - {schedule.close_time}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Sin horarios registrados</p>
                  <ScheduleManager
                    coffeeShopId={shop.id}
                    existingSchedules={[]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {shop.reviews && shop.reviews.length > 0 ? (
            shop.reviews.map((review: any, index: number) => (
              <Card key={review.created_at + index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                        U
                      </div>
                      <div>
                        <p className="font-medium">Usuario</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                {review.comment && (
                  <CardContent>
                    <p className="text-sm">{review.comment}</p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Esta cafetería aún no tiene reseñas
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
