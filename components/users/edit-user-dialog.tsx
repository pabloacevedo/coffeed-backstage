"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { updateUser } from "@/app/(dashboard)/users/actions"

type User = {
  id: string
  full_name: string | null
  email: string
  isAdmin?: boolean
}

export function EditUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(user.full_name || "")
  const [isAdmin, setIsAdmin] = useState(user.isAdmin || false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateUser(user.id, {
        full_name: fullName.trim() || null,
        isAdmin,
      })

      toast.success("Usuario actualizado correctamente")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario y sus permisos
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" value={user.email} disabled />
              <p className="text-xs text-muted-foreground">
                El correo no se puede modificar
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ingresa el nombre completo"
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="admin">Administrador</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir acceso al panel de administración
                </p>
              </div>
              <Switch
                id="admin"
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
