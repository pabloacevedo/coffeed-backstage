"use client"

import { useState } from "react"
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
import { Edit, MoreHorizontal, Trash2, Eye, MapPin, Star } from "lucide-react"
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

export function CoffeeShopsTable({ data }: { data: CoffeeShop[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const filteredData = data.filter((shop) =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      router.refresh()
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
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar estado")
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar cafeterías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredData.length} cafeterías encontradas
          </div>
        </div>

        <div className="rounded-md border">
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
                    No se encontraron cafeterías
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
