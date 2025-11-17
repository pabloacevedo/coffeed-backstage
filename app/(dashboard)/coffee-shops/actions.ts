"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"
import { extractPlaceIdFromUrl, expandShortUrl } from "@/lib/google-maps/extract-place-id"
import { getPlaceDetails, parseAddress, parseOpeningHours, getPhotoUrl, findPlaceByCoordinatesAndName } from "@/lib/google-maps/places-api"

/**
 * Normaliza el formato del teléfono a +56912345678 (sin espacios ni caracteres especiales)
 */
function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remover todos los caracteres que no sean números o el símbolo +
  let normalized = phone.replace(/[^\d+]/g, '')

  // Si no empieza con +, agregarlo
  if (!normalized.startsWith('+')) {
    // Si empieza con 56, agregar el +
    if (normalized.startsWith('56')) {
      normalized = '+' + normalized
    }
    // Si empieza con 9 (número de celular chileno), agregar +56
    else if (normalized.startsWith('9') && normalized.length >= 9) {
      normalized = '+56' + normalized
    }
    // Si tiene otro formato, dejarlo como está pero con +
    else {
      normalized = '+' + normalized
    }
  }

  return normalized
}

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
    console.log('🔗 URL original:', googleMapsUrl)

    // Paso 1: Expandir URL corta si es necesario
    let urlToProcess = googleMapsUrl
    let placeId = extractPlaceIdFromUrl(googleMapsUrl)

    console.log('🎯 Place ID inicial:', placeId)

    if (placeId === 'NEEDS_EXPANSION') {
      // URL corta detectada, expandirla primero
      console.log('📍 Expandiendo URL corta...')
      const expandedUrl = await expandShortUrl(googleMapsUrl)

      if (!expandedUrl) {
        return {
          success: false,
          error: "No se pudo expandir la URL corta de Google Maps. Intenta con la URL completa.",
        }
      }

      console.log('✅ URL expandida:', expandedUrl)
      urlToProcess = expandedUrl
      placeId = extractPlaceIdFromUrl(expandedUrl)
      console.log('🎯 Place ID extraído de URL expandida:', placeId)
    }

    // Si no se encontró Place ID, intentar buscar por nombre y coordenadas
    if (!placeId) {
      console.log('⚠️ No se encontró Place ID, intentando búsqueda por nombre y coordenadas...')
      placeId = await findPlaceByCoordinatesAndName(urlToProcess)

      if (!placeId) {
        return {
          success: false,
          error: "No se pudo encontrar la cafetería en Google Maps. Intenta con una URL diferente o verifica que el lugar exista.",
        }
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

    // Paso 4: Usar descripción vacía (se puede editar manualmente después)
    const description = null

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
      phone: normalizePhoneNumber(placeDetails.formatted_phone_number),
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
