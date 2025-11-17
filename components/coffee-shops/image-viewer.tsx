"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ImageUpload } from "./image-upload"

interface ImageViewerProps {
  image: string | null
  name: string
  coffeeShopId: string
}

export function ImageViewer({ image, name, coffeeShopId }: ImageViewerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setOpen(true)}
          />
        ) : (
          <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Sin imagen</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <ImageUpload
          coffeeShopId={coffeeShopId}
          coffeeShopName={name}
          currentImage={image}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            <img
              src={image || ""}
              alt={name}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
