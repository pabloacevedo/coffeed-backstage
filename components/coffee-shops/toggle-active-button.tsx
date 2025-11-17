"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Power, PowerOff } from "lucide-react"
import { toggleCoffeeShopStatus } from "@/app/(dashboard)/coffee-shops/actions"

interface ToggleActiveButtonProps {
  shopId: string
  currentStatus: boolean
}

export function ToggleActiveButton({ shopId, currentStatus }: ToggleActiveButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      // ✅ Ahora usa Server Action con validación de admin server-side
      await toggleCoffeeShopStatus(shopId, !currentStatus)

      toast.success(`Cafetería ${!currentStatus ? "activada" : "desactivada"} correctamente`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={currentStatus ? "outline" : "default"}
      onClick={handleToggle}
      disabled={loading}
    >
      {currentStatus ? (
        <>
          <PowerOff className="mr-2 h-4 w-4" />
          Desactivar
        </>
      ) : (
        <>
          <Power className="mr-2 h-4 w-4" />
          Activar
        </>
      )}
    </Button>
  )
}
