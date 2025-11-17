"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.info("Sesión cerrada")
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-600">
            <ShieldX className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder al panel de administración
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Esta cuenta no tiene privilegios de administrador. Si crees que esto es un error,
            contacta con el administrador del sistema.
          </p>
          <Button onClick={handleLogout} className="w-full" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
