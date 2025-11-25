"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Loader2, Link as LinkIcon, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { importFromGoogleMaps } from "@/app/(dashboard)/coffee-shops/actions"

interface ImportedData {
  name: string
  description: string | null
  phone: string | null
  website: string | null
  googleMapsUrl: string | null
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
  }
  schedule: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>
  imageUrl: string | null
}

interface ImportFromGoogleMapsProps {
  onImportSuccess: (data: ImportedData) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ImportFromGoogleMaps({
  onImportSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: ImportFromGoogleMapsProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [googleMapsUrl, setGoogleMapsUrl] = useState("")
  const [loading, setLoading] = useState(false)

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const handleImport = async () => {
    if (!googleMapsUrl.trim()) {
      toast.error("Por favor ingresa una URL de Google Maps")
      return
    }

    // Validate it's a Google Maps URL
    const isGoogleMapsUrl =
      googleMapsUrl.includes("google.com/maps") ||
      googleMapsUrl.includes("goo.gl") ||
      googleMapsUrl.includes("maps.app.goo.gl")

    if (!isGoogleMapsUrl) {
      toast.error("La URL debe ser de Google Maps")
      return
    }

    setLoading(true)
    try {
      const result = await importFromGoogleMaps(googleMapsUrl)

      if (result.success && result.data) {
        toast.success("✨ Cafetería importada exitosamente desde Google Maps")
        onImportSuccess(result.data)
        setOpen(false)
        setGoogleMapsUrl("")
      } else {
        toast.error(result.error || "Error al importar desde Google Maps")
      }
    } catch (error: any) {
      toast.error(error.message || "Error al importar desde Google Maps")
    } finally {
      setLoading(false)
    }
  }

  // Only show DialogTrigger if not controlled (for backwards compatibility)
  const showTrigger = controlledOpen === undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <MapPin className="h-4 w-4" />
            Importar desde Google Maps
            <Sparkles className="h-3 w-3 text-purple-500" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Importar Cafetería desde Google Maps
          </DialogTitle>
          <DialogDescription>
            Pega la URL de Google Maps de la cafetería y automáticamente obtendremos toda la información
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="google-maps-url">URL de Google Maps</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="google-maps-url"
                placeholder="https://maps.google.com/maps/place/..."
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Soporta: google.com/maps, goo.gl, maps.app.goo.gl
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Importación inteligente
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Obtendremos automáticamente: nombre, dirección, teléfono, horarios,
                  coordenadas, sitio web, foto y generaremos una descripción atractiva.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !googleMapsUrl.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Importar Cafetería
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
