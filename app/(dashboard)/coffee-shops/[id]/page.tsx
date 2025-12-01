import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Phone, Instagram, Globe, Clock, Star, Edit, Flag, ExternalLink } from "lucide-react"
import Link from "next/link"
import { ToggleActiveButton } from "@/components/coffee-shops/toggle-active-button"
import { ScheduleManager } from "@/components/coffee-shops/schedule-manager"
import { ContactsManager } from "@/components/coffee-shops/contacts-manager"
import { ImageViewer } from "@/components/coffee-shops/image-viewer"
import { DeleteButton } from "@/components/coffee-shops/delete-button"
import { MapModal } from "@/components/coffee-shops/map-modal"

async function getCoffeeShop(id: string) {
  // ✅ Usar cliente admin para poder ver todas las cafeterías, incluyendo las inactivas
  const supabase = createAdminSupabaseClient()

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

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

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
    <div className="space-y-4 md:space-y-6 px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{shop.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{shop.description || "Sin descripción"}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ToggleActiveButton shopId={shop.id} currentStatus={shop.active} />
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`https://coffeed.app/shop/${shop.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver perfil público
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/coffee-shops/${shop.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DeleteButton shopId={shop.id} shopName={shop.name} />
        </div>
      </div>

      {/* Status Cards */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Estado */}
            <div className="flex flex-col items-center sm:items-start sm:flex-row sm:gap-3">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg flex items-center justify-center ${shop.active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                <div className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${shop.active ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
              </div>
              <div className="text-center sm:text-left mt-1.5 sm:mt-0">
                <p className="text-xs text-muted-foreground leading-none mb-1">Estado</p>
                <p className="font-semibold text-xs sm:text-sm">{shop.active ? "Activa" : "Inactiva"}</p>
              </div>
            </div>

            {/* Calificación */}
            <div className="flex flex-col items-center sm:items-start sm:flex-row sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="text-center sm:text-left mt-1.5 sm:mt-0">
                <p className="text-xs text-muted-foreground leading-none mb-1">Rating</p>
                <div className="flex items-baseline gap-1 justify-center sm:justify-start">
                  <p className="font-bold text-base sm:text-lg leading-none">{avgRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">({shop.reviews?.length || 0})</p>
                </div>
              </div>
            </div>

            {/* Reportes */}
            <div className="flex flex-col items-center sm:items-start sm:flex-row sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Flag className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="text-center sm:text-left mt-1.5 sm:mt-0">
                <p className="text-xs text-muted-foreground leading-none mb-1">Reportes</p>
                <p className="font-bold text-base sm:text-lg leading-none">{pendingReports.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ver Reportes Button - Solo si hay reportes */}
      {activeReports.length > 0 && (
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={`/reports?coffee_shop=${shop.id}`}>
            <Flag className="mr-2 h-4 w-4" />
            Ver Todos los Reportes ({activeReports.length})
          </Link>
        </Button>
      )}

      {/* Imagen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl gap-4">Imagen</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageViewer image={shop.image} name={shop.name} coffeeShopId={shop.id} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="text-xs sm:text-sm">Información</TabsTrigger>
          <TabsTrigger value="schedules" className="text-xs sm:text-sm">Horarios</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm">Reseñas ({shop.reviews?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                Dirección
              </CardTitle>
            </CardHeader>
            <CardContent>
              {address ? (
                <div className="space-y-2">
                  <p className="text-sm md:text-base font-medium">{address.street}</p>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {address.city}, {address.country}
                  </p>
                  {shop.location_latitude && shop.location_longitude && (
                    <MapModal
                      latitude={shop.location_latitude}
                      longitude={shop.location_longitude}
                      name={shop.name}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm md:text-base text-muted-foreground">Sin dirección registrada</p>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
              <CardTitle className="text-lg md:text-xl">Contacto</CardTitle>
              <ContactsManager
                coffeeShopId={shop.id}
                existingContacts={shop.contacts || []}
              />
            </CardHeader>
            <CardContent>
              {shop.contacts && shop.contacts.length > 0 ? (
                <div className="space-y-3">
                  {shop.contacts.map((contact: any) => {
                    let href = "#"
                    let target = "_self"

                    if (contact.type === "phone") {
                      href = `tel:${contact.value}`
                    } else if (contact.type === "instagram") {
                      // Si el valor ya es una URL completa, úsala; si no, construye la URL
                      href = contact.value.startsWith("http")
                        ? contact.value
                        : `https://instagram.com/${contact.value.replace("@", "")}`
                      target = "_blank"
                    } else if (contact.type === "web") {
                      // Asegurar que tiene protocolo
                      href = contact.value.startsWith("http")
                        ? contact.value
                        : `https://${contact.value}`
                      target = "_blank"
                    }

                    return (
                      <div key={contact.id} className="flex items-center gap-3">
                        {contact.type === "phone" && <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        {contact.type === "instagram" && <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        {contact.type === "web" && <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        <a
                          href={href}
                          target={target}
                          rel={target === "_blank" ? "noopener noreferrer" : undefined}
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {contact.value}
                        </a>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm md:text-base text-muted-foreground mb-4">Sin información de contacto</p>
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
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
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
                        <span className="text-sm md:text-base font-medium">{daysOfWeek[schedule.day_of_week]}</span>
                        {schedule.closed ? (
                          <Badge variant="secondary" className="text-xs md:text-sm">Cerrado</Badge>
                        ) : (
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {schedule.open_time} - {schedule.close_time}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm md:text-base text-muted-foreground mb-4">Sin horarios registrados</p>
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0">
                        U
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium">Usuario</p>
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
                        <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                {review.comment && (
                  <CardContent>
                    <p className="text-sm md:text-base">{review.comment}</p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-sm md:text-base text-muted-foreground">
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
