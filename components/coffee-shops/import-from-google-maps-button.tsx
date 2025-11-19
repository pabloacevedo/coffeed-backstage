"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { ImportFromGoogleMaps } from "./import-from-google-maps"

export function ImportFromGoogleMapsButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleImportSuccess = (importedData: any) => {
    // Guardar los datos importados en sessionStorage para que la página de nueva cafetería los recoja
    sessionStorage.setItem('importedCoffeeShopData', JSON.stringify(importedData))
    // Guardar la ruta de retorno para redirigir después de crear
    sessionStorage.setItem('returnAfterCreate', '/')
    // Redirigir a la página de nueva cafetería
    router.push('/coffee-shops/new')
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full" size="lg">
        <MapPin className="mr-2 h-5 w-5" />
        Importar desde Google Maps
      </Button>
      <ImportFromGoogleMaps
        open={open}
        onOpenChange={setOpen}
        onImportSuccess={handleImportSuccess}
      />
    </>
  )
}
