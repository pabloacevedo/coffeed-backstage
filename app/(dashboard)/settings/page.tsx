import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings as SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Ajustes del panel de administración
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Esta sección estará disponible en futuras actualizaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aquí podrás configurar opciones del panel de administración, gestionar
            permisos de usuarios, configurar notificaciones y más.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
