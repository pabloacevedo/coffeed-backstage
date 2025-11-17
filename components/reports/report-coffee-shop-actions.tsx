"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { PowerOff } from "lucide-react"

interface ReportCoffeeShopActionsProps {
  coffeeShopId: string
  coffeeShopName: string
}

export function ReportCoffeeShopActions({
  coffeeShopId,
  coffeeShopName,
}: ReportCoffeeShopActionsProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("coffee_shops")
        .update({ active: false })
        .eq("id", coffeeShopId)

      if (error) throw error

      toast.success(`${coffeeShopName} ha sido desactivada`)
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al desactivar cafetería")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PowerOff className="mr-2 h-4 w-4" />
          Desactivar cafetería
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar cafetería?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás por desactivar <strong>{coffeeShopName}</strong>. La cafetería
            dejará de aparecer en la app móvil hasta que la vuelvas a activar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeactivate} disabled={loading}>
            {loading ? "Desactivando..." : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
