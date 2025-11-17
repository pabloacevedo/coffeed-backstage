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
import { Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DeleteButtonProps {
  shopId: string
  shopName: string
}

export function DeleteButton({ shopId, shopName }: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("coffee_shops")
        .update({ deleted: true })
        .eq("id", shopId)

      if (error) throw error

      toast.success("Cafetería eliminada correctamente")
      router.push("/coffee-shops")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar cafetería")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="default">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar cafetería?</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar <strong>{shopName}</strong>?
            <br />
            <br />
            Esta acción marcará la cafetería como eliminada. Podrás restaurarla
            posteriormente desde la base de datos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
