"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/lib/supabase/types"

type FeatureCategory = Database["public"]["Tables"]["feature_categories"]["Row"]

export default function NewFeaturePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categories, setCategories] = useState<FeatureCategory[]>([])
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    category_id: "",
    is_filterable: true,
    display_order: 0,
    active: true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoadingCategories(true)
      const { data, error } = await supabase
        .from("feature_categories")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error("Error loading categories:", error)
      toast.error("Error al cargar categorías")
    } finally {
      setLoadingCategories(false)
    }
  }

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!formData.name || !formData.slug || !formData.category_id) {
        toast.error("Por favor completa los campos obligatorios")
        setLoading(false)
        return
      }

      // Crear feature
      const { data, error } = await supabase
        .from("features")
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          icon: formData.icon || null,
          category_id: formData.category_id,
          is_filterable: formData.is_filterable,
          display_order: formData.display_order,
          active: formData.active,
        })
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe un feature con ese slug")
        } else {
          throw error
        }
        setLoading(false)
        return
      }

      toast.success("Feature creado exitosamente")
      router.push("/features")
      router.refresh()
    } catch (error: any) {
      console.error("Error creating feature:", error)
      toast.error(error.message || "Error al crear feature")
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/features">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Features
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Feature</h1>
        <p className="text-muted-foreground">
          Agrega una nueva característica al catálogo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ej: WiFi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="Generado automáticamente"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Se genera automáticamente del nombre
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe el feature..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="icon">Icono (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => updateField("icon", e.target.value)}
                  placeholder="Ej: 📶"
                  maxLength={2}
                />
                <p className="text-xs text-muted-foreground">
                  Un emoji que represente el feature
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Orden de Visualización</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => updateField("display_order", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>Opciones avanzadas del feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando categorías...
                </div>
              ) : (
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => updateField("category_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_filterable" className="text-base">
                  Filtrable
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permitir usar este feature como filtro en búsquedas
                </p>
              </div>
              <Switch
                id="is_filterable"
                checked={formData.is_filterable}
                onCheckedChange={(checked) => updateField("is_filterable", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-base">
                  Activo
                </Label>
                <p className="text-sm text-muted-foreground">
                  El feature estará visible y disponible para usar
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => updateField("active", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
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
                Crear Feature
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
