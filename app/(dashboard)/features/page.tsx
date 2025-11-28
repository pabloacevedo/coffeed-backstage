import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function FeaturesPage() {
  const supabase = createAdminSupabaseClient()

  // Obtener categorías con sus features
  const { data: categories } = await supabase
    .from('feature_categories')
    .select(`
      *,
      features (*)
    `)
    .order('display_order', { ascending: true })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Features</h2>
          <p className="text-muted-foreground">
            Gestiona las características disponibles para las cafeterías
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/features/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Feature
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
                <Badge variant={category.active ? "default" : "secondary"}>
                  {category.active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Features ({category.features?.length || 0})
                </p>
                <div className="space-y-1">
                  {category.features?.map((feature: any) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        {feature.icon && (
                          <span className="text-sm">{feature.icon}</span>
                        )}
                        <span className="text-sm">{feature.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {feature.is_filterable && (
                          <Badge variant="outline" className="text-xs">
                            Filtrable
                          </Badge>
                        )}
                        {!feature.active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!category.features || category.features.length === 0) && (
                    <p className="text-sm text-muted-foreground py-2">
                      No hay features en esta categoría
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!categories || categories.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No hay categorías de features configuradas
            </p>
            <Button asChild>
              <Link href="/features/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear primera categoría
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
