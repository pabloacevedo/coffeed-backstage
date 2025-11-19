"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink } from "lucide-react"

interface MapModalProps {
  latitude: number
  longitude: number
  name: string
}

export function MapModal({ latitude, longitude, name }: MapModalProps) {
  const [open, setOpen] = useState(false)

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
  // Usar formato de embed que no requiere API key (modo de búsqueda por coordenadas)
  const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=es&z=16&output=embed`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs md:text-sm text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
      >
        <MapPin className="h-3 w-3" />
        Coordenadas: {latitude}, {longitude}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación de {name}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en Google Maps
                </a>
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="w-full h-[500px] rounded-lg overflow-hidden border bg-muted">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa de ${name}`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Coordenadas: {latitude}, {longitude}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
