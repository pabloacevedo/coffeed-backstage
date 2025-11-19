"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, MoreHorizontal, Trash2, Eye, MapPin, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CoffeeShop {
  id: string
  name: string
  description: string | null
  image: string | null
  location_latitude: number | null
  location_longitude: number | null
  active: boolean
  created_at: string
  addresses?: any[]
  avgRating: number
  reviewCount: number
}

const PAGE_SIZE = 500

export function CoffeeShopsTable() {
  const [data, setData] = useState<CoffeeShop[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Cargar cafeterías desde Supabase
  const loadCoffeeShops = useCallback(async (offset: number = 0) => {
    if (offset === 0) {
      setLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      // Primero obtener el total de cafeterías
      const { count } = await supabase
        .from("coffee_shops")
        .select("*", { count: "exact", head: true })
        .eq("deleted", false)

      if (count !== null) {
        setTotalCount(count)
      }

      // Luego obtener la página actual
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
        .order("name", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        console.error('Error fetching coffee shops:', error)
        toast.error("Error al cargar cafeterías")
        return
      }

      // Calcular rating promedio
      const shopsWithRating = (coffeeShops || []).map((shop: any) => {
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

      if (offset === 0) {
        setData(shopsWithRating)
      } else {
        setData(prev => [...prev, ...shopsWithRating])
      }

      // Verificar si hay más datos
      setHasMore(coffeeShops && coffeeShops.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error loading coffee shops:', error)
      toast.error("Error al cargar cafeterías")
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }, [supabase])

  // Cargar datos iniciales
  useEffect(() => {
    loadCoffeeShops(0)
  }, [loadCoffeeShops])

  // Cargar automáticamente el siguiente lote cuando termine el anterior
  useEffect(() => {
    if (hasMore && !isLoadingMore && !loading && data.length > 0) {
      // Esperar un pequeño delay para no saturar
      const timer = setTimeout(() => {
        loadCoffeeShops(data.length)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [data.length, hasMore, isLoadingMore, loading, loadCoffeeShops])

  // Función para normalizar texto (remover tildes y caracteres especiales)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover tildes
  }

  const filteredData = data.filter((shop) => {
    const query = normalizeText(searchQuery)
    const name = normalizeText(shop.name)
    const description = normalizeText(shop.description || '')
    const city = normalizeText(shop.addresses?.[0]?.city || '')
    const country = normalizeText(shop.addresses?.[0]?.country || '')

    return (
      name.includes(query) ||
      description.includes(query) ||
      city.includes(query) ||
      country.includes(query)
    )
  })

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("coffee_shops")
        .update({ deleted: true })
        .eq("id", id)

      if (error) throw error

      toast.success("Cafetería eliminada correctamente")
      setDeleteDialog(null)
      // Recargar datos
      await loadCoffeeShops(0)
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar cafetería")
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("coffee_shops")
        .update({ active: !currentStatus })
        .eq("id", id)

      if (error) throw error

      toast.success(`Cafetería ${!currentStatus ? "activada" : "desactivada"}`)
      // Recargar datos
      await loadCoffeeShops(0)
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar estado")
    }
  }

  // if (loading && data.length === 0) {
  //   return (
  //     <div className="flex items-center justify-center py-12">
  //       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  //       <span className="ml-3 text-muted-foreground">Cargando cafeterías...</span>
  //     </div>
  //   )
  // }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Input
            placeholder="Buscar cafeterías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <div className="text-xs sm:text-sm text-muted-foreground sm:ml-auto">
            Mostrando {filteredData.length} de {totalCount} cafeterías
          </div>
        </div>

        {/* Vista de tabla para desktop */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((shop) => (
                  <TableRow
                    key={shop.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/coffee-shops/${shop.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {shop.image ? (
                          <img
                            src={shop.image}
                            alt={shop.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{shop.name}</p>
                          {shop.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {shop.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {shop.addresses && shop.addresses.length > 0 ? (
                        <div className="text-sm">
                          <p>{shop.addresses[0].city}</p>
                          <p className="text-xs text-muted-foreground">
                            {shop.addresses[0].country}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{shop.avgRating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({shop.reviewCount})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={shop.active ? "default" : "secondary"}>
                        {shop.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(shop.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/coffee-shops/${shop.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/coffee-shops/${shop.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive(shop.id, shop.active)}
                          >
                            {shop.active ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialog(shop.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {loading && data.length === 0 ? "Cargando cafeterías..." : "No se encontraron cafeterías"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Vista de tarjetas para mobile */}
        <div className="md:hidden space-y-3">
          {filteredData.length > 0 ? (
            filteredData.map((shop) => (
              <div
                key={shop.id}
                className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                onClick={() => router.push(`/coffee-shops/${shop.id}`)}
              >
                <div className="flex items-start gap-3">
                  {shop.image ? (
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-tight mb-1">{shop.name}</h3>
                    {shop.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {shop.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={shop.active ? "default" : "secondary"} className="text-xs">
                        {shop.active ? "Activa" : "Inactiva"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{shop.avgRating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({shop.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/coffee-shops/${shop.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/coffee-shops/${shop.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleActive(shop.id, shop.active)}
                        >
                          {shop.active ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog(shop.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {shop.addresses && shop.addresses.length > 0 ? (
                      <span>
                        {shop.addresses[0].city}
                        {shop.addresses[0].country && `, ${shop.addresses[0].country}`}
                      </span>
                    ) : (
                      <span>Sin dirección</span>
                    )}
                  </div>
                  <span>
                    {new Date(shop.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              {loading && data.length === 0 ? "Cargando cafeterías..." : "No se encontraron cafeterías"}
            </div>
          )}
        </div>

        {/* Indicador de carga automática */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Cargando cafeterías... ({data.length} de {totalCount})
            </span>
          </div>
        )}

        {!hasMore && !isLoadingMore && data.length > 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            ✓ Todas las cafeterías cargadas ({totalCount} total)
          </div>
        )}
      </div>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cafetería?</DialogTitle>
            <DialogDescription>
              Esta acción marcará la cafetería como eliminada. Podrás restaurarla
              posteriormente desde la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
