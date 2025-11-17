"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface CoffeeShopFormProps {
  shop: any
}

export function CoffeeShopForm({ shop }: CoffeeShopFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: shop.name || "",
    description: shop.description || "",
    image: shop.image || "",
    location_latitude: shop.location_latitude || "",
    location_longitude: shop.location_longitude || "",
    street: shop.addresses?.[0]?.street || "",
    city: shop.addresses?.[0]?.city || "",
    country: shop.addresses?.[0]?.country || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update coffee shop
      const { error: shopError } = await supabase
        .from("coffee_shops")
        .update({
          name: formData.name,
          description: formData.description,
          image: formData.image,
          location_latitude: formData.location_latitude ? parseFloat(formData.location_latitude) : null,
          location_longitude: formData.location_longitude ? parseFloat(formData.location_longitude) : null,
        })
        .eq("id", shop.id)

      if (shopError) throw shopError

      // Update or create address
      if (shop.addresses?.[0]?.id) {
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            street: formData.street,
            city: formData.city,
            country: formData.country,
          })
          .eq("id", shop.addresses[0].id)

        if (addressError) throw addressError
      } else if (formData.street || formData.city || formData.country) {
        const { error: addressError } = await supabase
          .from("addresses")
          .insert({
            coffee_shop_id: shop.id,
            street: formData.street,
            city: formData.city,
            country: formData.country,
          })

        if (addressError) throw addressError
      }

      toast.success("Cafetería actualizada correctamente")
      router.push(`/coffee-shops/${shop.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar cafetería")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">URL de Imagen</Label>
          <Input
            id="image"
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ubicación</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitud</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={formData.location_latitude}
              onChange={(e) => setFormData({ ...formData, location_latitude: e.target.value })}
              placeholder="-33.4422512"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitud</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={formData.location_longitude}
              onChange={(e) => setFormData({ ...formData, location_longitude: e.target.value })}
              placeholder="-70.6525297"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dirección</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Calle</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="Av. Providencia 123"
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Santiago"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Chile"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/coffee-shops/${shop.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
        </Button>
      </div>
    </form>
  )
}
