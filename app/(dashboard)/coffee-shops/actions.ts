"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"
import { extractPlaceIdFromUrl } from "@/lib/google-maps/extract-place-id"
import { getPlaceDetails, parseAddress, parseOpeningHours, getPhotoUrl } from "@/lib/google-maps/places-api"
import { generateCoffeeShopDescription } from "@/lib/openai/generate-description"

/**
 * Activa o desactiva una cafetería
 */
export async function toggleCoffeeShopStatus(shopId: string, newStatus: boolean) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin
  await requireAdmin()
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("coffee_shops")
    .update({ active: newStatus })
    .eq("id", shopId)
    .select()

  if (error) {
    throw new Error("Error al cambiar el estado de la cafetería")
  }

  if (!data || data.length === 0) {
    throw new Error("Cafetería no encontrada")
  }

  revalidatePath("/coffee-shops", "page")
  revalidatePath(`/coffee-shops/${shopId}`, "page")

  return { success: true, data: data[0] }
}

/**
 * Desactiva una cafetería (usado desde reportes)
 */
export async function deactivateCoffeeShop(shopId: string) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin
  await requireAdmin()
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("coffee_shops")
    .update({ active: false })
    .eq("id", shopId)
    .select()

  if (error) {
    throw new Error("Error al desactivar la cafetería")
  }

  if (!data || data.length === 0) {
    throw new Error("Cafetería no encontrada")
  }

  revalidatePath("/coffee-shops", "page")
  revalidatePath(`/coffee-shops/${shopId}`, "page")
  revalidatePath("/reports", "page")

  return { success: true }
}

/**
 * Importa una cafetería desde Google Maps usando su URL
 */
export async function importFromGoogleMaps(googleMapsUrl: string) {
  // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario sea admin
  await requireAdmin()

  try {
    // Paso 1: Extraer el Place ID de la URL
    let placeId = extractPlaceIdFromUrl(googleMapsUrl)

    if (!placeId) {
      return {
        success: false,
        error: "No se pudo extraer el Place ID de la URL. Verifica que sea una URL válida de Google Maps.",
      }
    }

    // Paso 2: Obtener detalles del lugar desde Google Places API
    const placeDetails = await getPlaceDetails(placeId)

    if (!placeDetails) {
      return {
        success: false,
        error: "No se pudo obtener información del lugar desde Google Maps.",
      }
    }

    // Paso 3: Parsear la dirección
    const address = parseAddress(placeDetails.formatted_address)

    // Paso 4: Generar descripción con OpenAI
    const description = await generateCoffeeShopDescription({
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      rating: placeDetails.rating,
      reviews: placeDetails.reviews,
    })

    // Paso 5: Obtener URL de la primera foto
    let imageUrl = null
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      const photoReference = placeDetails.photos[0].photo_reference
      imageUrl = getPhotoUrl(photoReference)
    }

    // Paso 6: Parsear horarios
    const schedule = parseOpeningHours(placeDetails.opening_hours)

    // Paso 7: Preparar datos para retornar
    const importedData = {
      name: placeDetails.name,
      description: description,
      phone: placeDetails.formatted_phone_number || null,
      website: placeDetails.website || null,
      googleMapsUrl: placeDetails.url || googleMapsUrl,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
        latitude: placeDetails.geometry.location.lat,
        longitude: placeDetails.geometry.location.lng,
      },
      schedule,
      imageUrl,
    }

    return {
      success: true,
      data: importedData,
    }
  } catch (error: any) {
    console.error("Error importing from Google Maps:", error)
    return {
      success: false,
      error: error.message || "Error al importar desde Google Maps",
    }
  }
}
