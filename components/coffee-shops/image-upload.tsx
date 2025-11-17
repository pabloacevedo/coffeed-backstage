"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ImageUploadProps {
  coffeeShopId: string
  coffeeShopName: string
  currentImage: string | null
}

export function ImageUpload({ coffeeShopId, coffeeShopName, currentImage }: ImageUploadProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("Por favor selecciona un archivo de imagen")
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB")
        return
      }

      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor selecciona una imagen")
      return
    }

    setLoading(true)
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${coffeeShopId}-${Date.now()}.${fileExt}`
      const filePath = `coffee-shops/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // Update coffee shop record
      const { error: updateError } = await supabase
        .from('coffee_shops')
        .update({ image: publicUrl })
        .eq('id', coffeeShopId)

      if (updateError) throw updateError

      // Delete old image if exists
      if (currentImage && currentImage.includes('supabase')) {
        try {
          const oldPath = currentImage.split('/').slice(-2).join('/')
          await supabase.storage
            .from('images')
            .remove([oldPath])
        } catch (err) {
          console.warn("Could not delete old image:", err)
        }
      }

      toast.success("Imagen actualizada correctamente")
      setOpen(false)
      setFile(null)
      setPreview(null)
      router.refresh()
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast.error(error.message || "Error al subir la imagen")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Cambiar Imagen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar Imagen de {coffeeShopName}</DialogTitle>
          <DialogDescription>
            Sube una nueva imagen para la cafetería. Formatos soportados: JPG, PNG, WebP. Tamaño máximo: 5MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Seleccionar imagen</Label>
            <Input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {preview && (
            <div className="space-y-2">
              <Label>Vista previa</Label>
              <div className="relative w-full h-64 rounded-lg border overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
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
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
