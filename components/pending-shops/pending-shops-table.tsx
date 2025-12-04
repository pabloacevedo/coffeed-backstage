/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Check, X, Eye, MapPin } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { approveCoffeeShop, rejectCoffeeShop } from "@/app/(dashboard)/coffee-shops/actions"

interface PendingShop {
  id: string
  name: string
  description: string | null
  image: string | null
  submitted_at: string
  submitted_by: string | null
  addresses?: any[]
  avgRating: number
  reviewCount: number
}

export function PendingShopsTable({ data }: { data: PendingShop[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectDialog, setRejectDialog] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  const filteredData = data.filter((shop) => {
    const query = normalizeText(searchQuery)
    const name = normalizeText(shop.name)
    const description = normalizeText(shop.description || '')
    const city = normalizeText(shop.addresses?.[0]?.city || '')

    return (
      name.includes(query) ||
      description.includes(query) ||
      city.includes(query)
    )
  })

  const handleApprove = async (id: string) => {
    setLoading(true)
    try {
      await approveCoffeeShop(id)
      toast.success("Cafetería aprobada correctamente")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al aprobar cafetería")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog) return
    if (!rejectionReason.trim()) {
      toast.error("Por favor ingresa una razón para el rechazo")
      return
    }

    setLoading(true)
    try {
      await rejectCoffeeShop(rejectDialog, rejectionReason)
      toast.success("Cafetería rechazada")
      setRejectDialog(null)
      setRejectionReason("")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al rechazar cafetería")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar cafeterías pendientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredData.length} cafeterías pendientes
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((shop) => (
                  <TableRow key={shop.id}>
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
                      <div className="text-sm">
                        {new Date(shop.submitted_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/coffee-shops/${shop.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            Ver
                          </Link>
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(shop.id)}
                          disabled={loading}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRejectDialog(shop.id)}
                          disabled={loading}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {searchQuery ? "No se encontraron cafeterías" : "No hay cafeterías pendientes"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!rejectDialog} onOpenChange={() => {
        setRejectDialog(null)
        setRejectionReason("")
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar cafetería</DialogTitle>
            <DialogDescription>
              Por favor proporciona una razón para el rechazo. Esto ayudará al usuario a entender por qué su cafetería no fue aprobada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Razón del rechazo</Label>
              <Textarea
                id="reason"
                placeholder="Ej: La cafetería no cumple con los requisitos mínimos, información incompleta, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog(null)
                setRejectionReason("")
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
