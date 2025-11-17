"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ImportFromGoogleMaps } from "@/components/coffee-shops/import-from-google-maps"
import { createClient } from "@/lib/supabase/client"

interface FormData {
  name: string
  description: string
  phone: string
  website: string
  googleMapsUrl: string
  street: string
  city: string
  country: string
  latitude: string
  longitude: string
  imageUrl: string
  schedule: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: '09:00',
  closeTime: '18:00',
  isClosed: i === 6, // Domingo (índice 6) cerrado por defecto
}))

export default function NewCoffeeShopPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    phone: '',
    website: '',
    googleMapsUrl: '',
    street: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    imageUrl: '',
    schedule: defaultSchedule,
  })

  // Check for imported data in sessionStorage on component mount
  useEffect(() => {
    const importedDataStr = sessionStorage.getItem('importedCoffeeShopData')
    if (importedDataStr) {
      try {
        const importedData = JSON.parse(importedDataStr)
        handleImportSuccess(importedData)
        // Clear the sessionStorage after using it
        sessionStorage.removeItem('importedCoffeeShopData')
        toast.success('Datos importados desde Google Maps')
      } catch (error) {
        console.error('Error parsing imported data:', error)
      }
    }
  }, [])

  const handleImportSuccess = (importedData: any) => {
    setFormData({
      name: importedData.name || '',
      description: importedData.description || '',
      phone: importedData.phone || '',
      website: importedData.website || '',
      googleMapsUrl: importedData.googleMapsUrl || '',
      street: importedData.address?.street || '',
      city: importedData.address?.city || '',
      country: importedData.address?.country || '',
      latitude: importedData.address?.latitude?.toString() || '',
      longitude: importedData.address?.longitude?.toString() || '',
      imageUrl: importedData.imageUrl || '',
      schedule: importedData.schedule || defaultSchedule,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Validaciones básicas
      if (!formData.name || !formData.street || !formData.city) {
        toast.error('Por favor completa los campos obligatorios')
        setLoading(false)
        return
      }

      // 1. Crear la cafetería
      const { data: coffeeShop, error: shopError } = await supabase
        .from('coffee_shops')
        .insert({
          name: formData.name,
          description: formData.description || null,
          image: formData.imageUrl || null,
          location_latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          location_longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          active: true,
        })
        .select()
        .single()

      if (shopError) throw shopError

      // 2. Crear la dirección
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          coffee_shop_id: coffeeShop.id,
          street: formData.street,
          city: formData.city,
          country: formData.country,
        })

      if (addressError) throw addressError

      // 3. Crear contactos
      const contactsToInsert = []

      if (formData.phone) {
        contactsToInsert.push({
          coffee_shop_id: coffeeShop.id,
          type: 'phone',
          value: formData.phone,
        })
      }

      if (formData.website) {
        contactsToInsert.push({
          coffee_shop_id: coffeeShop.id,
          type: 'web',
          value: formData.website,
        })
      }

      if (contactsToInsert.length > 0) {
        const { error: contactError } = await supabase
          .from('contacts')
          .insert(contactsToInsert)

        if (contactError) throw contactError
      }

      // 4. Crear horarios
      const schedulesToInsert = formData.schedule.map((s) => ({
        coffee_shop_id: coffeeShop.id,
        day_of_week: s.dayOfWeek,
        open_time: s.isClosed ? null : s.openTime,
        close_time: s.isClosed ? null : s.closeTime,
        closed: s.isClosed,
        deleted: false,
      }))

      const { error: scheduleError } = await supabase
        .from('schedules')
        .insert(schedulesToInsert)

      if (scheduleError) throw scheduleError

      toast.success('Cafetería creada exitosamente')
      router.push('/coffee-shops')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating coffee shop:', error)
      toast.error(error.message || 'Error al crear la cafetería')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateSchedule = (dayIndex: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s, i) =>
        i === dayIndex ? { ...s, [field]: value } : s
      ),
    }))
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/coffee-shops">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nueva Cafetería</h1>
            <p className="text-muted-foreground">
              Agrega una nueva cafetería a la plataforma
            </p>
          </div>
        </div>
        <ImportFromGoogleMaps onImportSuccess={handleImportSuccess} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales de la cafetería</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ej: Café del Centro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de Imagen</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => updateField('imageUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe la cafetería..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
            <CardDescription>Ubicación de la cafetería</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Calle *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => updateField('street', e.target.value)}
                placeholder="Ej: Av. Principal 123"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Ej: Santiago"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="Ej: Chile"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitud</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  placeholder="Ej: -33.4489"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitud</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  placeholder="Ej: -70.6693"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
            <CardDescription>Información de contacto de la cafetería</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Ej: +56 9 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleMapsUrl">URL Google Maps</Label>
                <Input
                  id="googleMapsUrl"
                  value={formData.googleMapsUrl}
                  onChange={(e) => updateField('googleMapsUrl', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
            <CardDescription>Configura los horarios de atención</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.schedule.map((schedule, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 font-medium">{daysOfWeek[schedule.dayOfWeek]}</div>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={schedule.openTime}
                    onChange={(e) => updateSchedule(index, 'openTime', e.target.value)}
                    disabled={schedule.isClosed}
                    className="w-32"
                  />
                  <span>-</span>
                  <Input
                    type="time"
                    value={schedule.closeTime}
                    onChange={(e) => updateSchedule(index, 'closeTime', e.target.value)}
                    disabled={schedule.isClosed}
                    className="w-32"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.isClosed}
                      onChange={(e) => updateSchedule(index, 'isClosed', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Cerrado</span>
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Crear Cafetería
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
