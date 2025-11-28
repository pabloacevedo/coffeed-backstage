"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"

type FeatureCategory = Database["public"]["Tables"]["feature_categories"]["Row"]
type Feature = Database["public"]["Tables"]["features"]["Row"]
type CoffeeShopFeature = Database["public"]["Tables"]["coffee_shop_features"]["Row"]

interface FeaturesManagerProps {
  coffeeShopId: string
  initialFeatures?: CoffeeShopFeature[]
}

interface FeatureWithCategory extends Feature {
  isSelected: boolean
  isVerified: boolean
}

interface CategoryWithFeatures {
  category: FeatureCategory
  features: FeatureWithCategory[]
}

export function FeaturesManager({ coffeeShopId, initialFeatures = [] }: FeaturesManagerProps) {
  const [categories, setCategories] = useState<CategoryWithFeatures[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadFeatures()
  }, [coffeeShopId])

  async function loadFeatures() {
    try {
      setLoading(true)

      // Obtener categorías
      const { data: categoriesData, error: catError } = await supabase
        .from("feature_categories")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true })

      if (catError) throw catError

      // Obtener features
      const { data: featuresData, error: featError } = await supabase
        .from("features")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true })

      if (featError) throw featError

      // Obtener features de la cafetería
      const { data: shopFeaturesData, error: shopFeatError } = await supabase
        .from("coffee_shop_features")
        .select("*")
        .eq("coffee_shop_id", coffeeShopId)

      if (shopFeatError) throw shopFeatError

      // Mapear features con estado de selección
      const shopFeatureIds = new Set(shopFeaturesData?.map(sf => sf.feature_id) || [])
      const verifiedFeatureIds = new Set(
        shopFeaturesData?.filter(sf => sf.verified).map(sf => sf.feature_id) || []
      )

      const featuresWithStatus = featuresData?.map(feature => ({
        ...feature,
        isSelected: shopFeatureIds.has(feature.id),
        isVerified: verifiedFeatureIds.has(feature.id)
      })) || []

      // Agrupar por categoría
      const grouped: CategoryWithFeatures[] = (categoriesData || []).map(category => ({
        category,
        features: featuresWithStatus.filter(f => f.category_id === category.id)
      })).filter(g => g.features.length > 0)

      setCategories(grouped)
    } catch (error: any) {
      console.error("Error loading features:", error)
      toast.error("Error al cargar features")
    } finally {
      setLoading(false)
    }
  }

  async function toggleFeature(featureId: string, currentState: boolean) {
    try {
      if (currentState) {
        // Eliminar feature
        const { error } = await supabase
          .from("coffee_shop_features")
          .delete()
          .eq("coffee_shop_id", coffeeShopId)
          .eq("feature_id", featureId)

        if (error) throw error

        toast.success("Feature eliminado")
      } else {
        // Agregar feature
        const { error } = await supabase
          .from("coffee_shop_features")
          .insert({
            coffee_shop_id: coffeeShopId,
            feature_id: featureId,
            verified: false
          })

        if (error) throw error

        toast.success("Feature agregado")
      }

      // Actualizar estado local
      setCategories(prev => prev.map(cat => ({
        ...cat,
        features: cat.features.map(f =>
          f.id === featureId
            ? { ...f, isSelected: !currentState, isVerified: false }
            : f
        )
      })))
    } catch (error: any) {
      console.error("Error toggling feature:", error)
      toast.error("Error al actualizar feature")
    }
  }

  async function verifyFeature(featureId: string) {
    try {
      const { error } = await supabase
        .from("coffee_shop_features")
        .update({
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq("coffee_shop_id", coffeeShopId)
        .eq("feature_id", featureId)

      if (error) throw error

      toast.success("Feature verificado")

      // Actualizar estado local
      setCategories(prev => prev.map(cat => ({
        ...cat,
        features: cat.features.map(f =>
          f.id === featureId ? { ...f, isVerified: true } : f
        )
      })))
    } catch (error: any) {
      console.error("Error verifying feature:", error)
      toast.error("Error al verificar feature")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Características (Features)</CardTitle>
        <CardDescription>
          Selecciona las características que tiene esta cafetería
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(({ category, features }) => (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center gap-2">
              {category.icon && <span className="text-xl">{category.icon}</span>}
              <h3 className="font-semibold">{category.name}</h3>
              <Badge variant="outline" className="text-xs">
                {features.filter(f => f.isSelected).length} / {features.length}
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(feature => (
                <div
                  key={feature.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border
                    ${feature.isSelected ? "bg-accent border-primary" : "bg-background"}
                    transition-colors cursor-pointer
                  `}
                  onClick={() => toggleFeature(feature.id, feature.isSelected)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {feature.icon && (
                      <span className="text-sm">{feature.icon}</span>
                    )}
                    <span className="text-sm font-medium">{feature.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {feature.isSelected && feature.isVerified && (
                      <Badge variant="default" className="text-xs">
                        Verificado
                      </Badge>
                    )}
                    {feature.isSelected && !feature.isVerified && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          verifyFeature(feature.id)
                        }}
                        className="h-6 px-2"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {feature.isSelected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay features disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
