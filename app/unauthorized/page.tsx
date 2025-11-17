"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CoffeedLogo } from "@/components/coffeed-logo"

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-purple-50 to-pink-50 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10">
        <CardHeader className="space-y-6 text-center pb-6">
          <div className="mx-auto space-y-4">
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl blur-md opacity-50"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
                <CoffeedLogo size={40} />
              </div>
            </div>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <ShieldX className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-red-600">Acceso Denegado</CardTitle>
            <CardDescription className="text-base mt-2">
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
