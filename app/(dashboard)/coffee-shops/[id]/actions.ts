"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"

export async function uploadCoffeeShopImage(
  coffeeShopId: string,
  formData: FormData
) {
  // Verificar que el usuario sea admin
  await requireAdmin()

  const file = formData.get("file") as File
  if (!file) {
    return { success: false, error: "No se proporcionó ningún archivo" }
  }

  // Validar tipo de archivo
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "El archivo debe ser una imagen" }
  }

  // Validar tamaño (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "La imagen no debe superar los 5MB" }
  }

  try {
    const supabase = createAdminSupabaseClient()

    // Convertir el archivo a ArrayBuffer y luego a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Crear nombre único
    const fileExt = file.name.split(".").pop()
    const fileName = `${coffeeShopId}-${Date.now()}.${fileExt}`
    const filePath = `coffee-shops/${fileName}`

    // Subir a Supabase Storage usando el cliente admin
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw uploadError
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath)

    // Obtener la imagen actual antes de actualizar
    const { data: currentShop } = await supabase
      .from("coffee_shops")
      .select("image")
      .eq("id", coffeeShopId)
      .single()

    // Actualizar el registro de la cafetería
    const { error: updateError } = await supabase
      .from("coffee_shops")
      .update({ image: publicUrl })
      .eq("id", coffeeShopId)

    if (updateError) throw updateError

    // Eliminar la imagen antigua si existe y es de Supabase
    if (currentShop?.image && currentShop.image.includes("supabase")) {
      try {
        const oldPath = currentShop.image.split("/").slice(-2).join("/")
        await supabase.storage.from("images").remove([oldPath])
      } catch (err) {
        // Silenciar error - la eliminación de la imagen antigua no es crítica
        console.warn("Error deleting old image:", err)
      }
    }

    revalidatePath(`/coffee-shops/${coffeeShopId}`)
    revalidatePath("/coffee-shops")

    return { success: true, imageUrl: publicUrl }
  } catch (error: any) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error: error.message || "Error al subir la imagen",
    }
  }
}
